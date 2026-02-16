/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { register_payment_method } from "@point_of_sale/app/services/pos_store";

export class PaymentHobex {
    constructor(pos, paymentMethod) {
        this.pos = pos;
        this.paymentMethod = paymentMethod;

        // Odoo uses this for "quick/fast payments" UI flows
        this.fastPayments = false;

        // Odoo checks this to decide whether reversal UI/features apply
        this.supports_reversals = true;
    }

    // ----------------------------
    // Helpers (ported from your old PaymentInterface class)
    // ----------------------------

    update_payment_line_values_from_hobex(line, result) {
        line.hobex_receipt = result.receipt;
        line.hobex_approvalCode = result.approvalCode;
        line.hobex_actionCode = result.actionCode;
        line.hobex_aid = result.aid;
        line.hobex_reference = result.reference;
        line.hobex_tid = result.tid;
        line.hobex_transactionId = result.transactionId;
        line.hobex_transactionDate = result.transactionDate;
        line.hobex_cardNumber = result.cardNumber;
        line.hobex_cardExpiry = result.cardExpiry;
        line.hobex_brand = result.brand;
        line.hobex_cardIssuer = result.cardIssuer;
        line.hobex_transactionType = result.transactionType;
        line.hobex_responseCode = result.responseCode;
        line.hobex_responseText = result.responseText;
        line.hobex_cvm = result.cvm;

        if (result.cvm === 1 && this.pos.hardwareProxy?.printer && result.cvm_receipt) {
            this.print_hobex_receipt(result.cvm_receipt);
        }
    }

    print_hobex_receipt(receipt) {
        const htmlString = `\n${receipt.replace(/\r\n/g, "\n")}\n`;
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlString;
        const element = tempDiv.firstChild;
        this.pos.hardwareProxy?.printer?.printReceipt(element);
    }

    _hobex_handle_payment_request_done(line, resolve, response) {
        line.hobex_responseCode = response.responseCode;

        window.__hobex_last_response__ = response;
console.log("HOBEX RESPONSE:", response);

        if (response.responseCode === "0") {
            line.setPaymentStatus("done");
            this.update_payment_line_values_from_hobex(line, response);
            resolve(true);
        } else {
            line.setPaymentStatus("retry");

            if (response.responseCode === "8004") {
                this.pos.env.bus.trigger("hobex_error", {
                    title: _t("hobex"),
                    body: _t("Die Transaktion wurde am Terminal abgebrochen"),
                });
            } else if (response.responseCode === "8003") {
                this.pos.env.bus.trigger("hobex_error", {
                    title: _t("hobex Gerätefehler"),
                    body: _t(
                        "Das Terminal scheint nicht erreichbar zu sein.\nBitte überprüfen Sie die Verbindung des Terminals mit dem Netzwerk und versuchen Sie es erneut."
                    ),
                });
            } else {
                this.pos.env.bus.trigger("hobex_error", {
                    title: _t("hobex Antwort"),
                    body: `${response.responseCode}: ${response.responseText}`,
                });
            }
            resolve(false);
        }
    }

    _hobex_handle_payment_request_failure(line, resolve) {
        line.setPaymentStatus("retry");
        this.pos.env.bus.trigger("hobex_error", {
            title: _t("Achtung Fehler"),
            body: _t("Es ist ein Fehler bei der Kommunikation mit dem Odoo / hobex Server aufgetreten !"),
        });
        resolve(false);
    }

    _hobex_handle_status_connection_failure(line, data = {}) {
        this.pos.env.bus.trigger("hobex_error", {
            title: _t("hobex Fehler"),
            body: _t(data.message || ""),
        });
        line.setPaymentStatus("waiting");
        return Promise.reject(data);
    }

    _hobex_handle_status_update_response(line, resolve, response) {
        if (response?.error === true) {
            line.setPaymentStatus("retry");
            resolve(false);
            return;
        }

        const result = response.res ?? response;
        line.hobex_responseCode = result.responseCode;

        if (result.responseCode === "0" && result.state === "OK") {
            this.update_payment_line_values_from_hobex(line, result);
            line.setPaymentStatus("done");
            resolve(true);
        } else if (result.responseCode === "0" && result.state === "VOID") {
            this.update_payment_line_values_from_hobex(line, result);
            line.setAmount(0);
            line.setPaymentStatus("reversed");
            resolve(true);
        } else {
            line.setPaymentStatus("retry");
            resolve(false);
        }
    }

    async _hobex_update_payment_status(order, uuid) {
        const line = order.payment_ids.find((paymentLine) => paymentLine.uuid === uuid);
        line.setPaymentStatus("waitingCard");

        return new Promise((resolve) => {
            this.pos.data
                .silentCall("pos.payment.method", "proxy_hobex_status_request", [[this.paymentMethod.id], line.transaction_id])
                .then(this._hobex_handle_status_update_response.bind(this, line, resolve))
                .catch(this._hobex_handle_status_connection_failure.bind(this, line));
        });
    }

    _hobex_handle_reversal_response(line, resolve, response) {
        line.hobex_responseCode = response.responseCode;

        if (response.responseCode === "0") {
            line.setPaymentStatus("reversed");
            this.update_payment_line_values_from_hobex(line, response);
            resolve(true);
        } else {
            this.pos.env.bus.trigger("hobex_error", {
                title: _t("hobex Antwort"),
                body: `${response.responseCode}: ${response.responseText}`,
            });
            resolve(false);
        }
    }

    // ----------------------------
    // Odoo 19 terminal API (camelCase) — this is what POS calls
    // ----------------------------

    async sendPaymentRequest(uuid) {
        const order = this.pos.getOrder();
        const line = order.payment_ids.find((paymentLine) => paymentLine.uuid === uuid);

        // Prevent negative amounts
        if (line.amount < 0) {
            this.pos.env.bus.trigger("hobex_error", {
                title: _t("Negative Beträge nicht möglich."),
                body: _t("Es ist nicht möglich einen negativen Betrag zurückzubuchen."),
            });
            line.setPaymentStatus("force_done");
            return false;
        }

        // Already successful
        if (line.transaction_id && line.hobex_responseCode === "0") {
            line.setPaymentStatus("done");
            return true;
        }

        // If previous try failed, reset transaction_id for a retry
        if (line.transaction_id && line.hobex_responseCode && line.hobex_responseCode !== "0") {
            line.transaction_id = null;
        }

        // Start new payment
        line.setPaymentStatus("waitingCard");
        line.transaction_id = Date.now();

        const data = {
            amount: Math.round(line.amount / this.pos.currency.rounding) * this.pos.currency.rounding,
            currency: this.pos.currency.name,
            tid: line.payment_method_id.hobex_terminal_id,
            reference: order.pos_reference,
            transactionId: line.transaction_id,
        };

        return new Promise((resolve) => {
            this.pos.data
                .silentCall("pos.payment.method", "proxy_hobex_payment_request", [[this.paymentMethod.id], data])
                .then(this._hobex_handle_payment_request_done.bind(this, line, resolve))
                .catch(this._hobex_handle_payment_request_failure.bind(this, line, resolve));
        });
    }

    // POS may call this when user hits cancel; your old logic was "cannot cancel from POS"
    async sendPaymentCancel() {
        this.pos.env.bus.trigger("hobex_error", {
            title: _t("ACHTUNG"),
            body: _t("Die Zahlung muss am Terminal abgebrochen werden !"),
        });
        return false;
    }

    async sendPaymentReversal(uuid) {
        const order = this.pos.get_order();
        const line = order.payment_ids.find((paymentLine) => paymentLine.uuid === uuid);

        line.setPaymentStatus("reversing");

        return new Promise((resolve) => {
            this.pos.data
                .silentCall("pos.payment.method", "proxy_hobex_reversal_request", [[this.paymentMethod.id], line.transaction_id])
                .then(this._hobex_handle_reversal_response.bind(this, line, resolve))
                .catch(this._hobex_handle_status_connection_failure.bind(this, line));
        });
    }
}

register_payment_method("hobex", PaymentHobex);
