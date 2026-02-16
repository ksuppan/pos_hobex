/** @odoo-module **/

import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { patch } from "@web/core/utils/patch";
import { useBus } from "@web/core/utils/hooks";
import { AlertDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { onMounted } from "@odoo/owl";

patch(PaymentScreen.prototype, {
    setup() {
        super.setup(...arguments);

        // listen to errors emitted by your payment interface
        useBus(this.pos.env.bus, "hobex_error", this._showHobexError);

        onMounted(async () => {
            const pendingPaymentLine = this.currentOrder.payment_ids.find(
                (paymentLine) =>
                    paymentLine.payment_method_id.use_payment_terminal === "hobex" &&
                    !paymentLine.is_done() &&
                    paymentLine.transaction_id
            );

            if (!pendingPaymentLine) return;

            await pendingPaymentLine.payment_method_id.payment_terminal._hobex_update_payment_status(
                this.currentOrder,
                pendingPaymentLine.uuid
            );
        });
    },

    _showHobexError(ev) {
        this.env.services.dialog.add(AlertDialog, {
            title: ev.detail.title,
            body: ev.detail.body,
        });
    },

    deletePaymentLine(uuid) {
        const order = this.pos.get_order();
        const line = order.payment_ids.find((l) => l.uuid === uuid);

        if (
            line?.payment_method_id?.use_payment_terminal === "hobex" &&
            line.transaction_id &&
            line.get_payment_status() === "retry"
        ) {
            this.currentOrder.remove_paymentline(line);
            this.numberBuffer.reset();
            return;
        }

        if (
            line?.payment_method_id?.use_payment_terminal === "hobex" &&
            line.transaction_id &&
            line.hobex_responseCode === "0"
        ) {
            this.env.services.dialog.add(AlertDialog, {
                title: "ACHTUNG",
                body: "Die Zahlung war erfolgreich, kann nicht gelöscht werden !",
            });
            return;
        }

        if (
            line?.payment_method_id?.use_payment_terminal === "hobex" &&
            line.transaction_id &&
            (line.hobex_responseCode === "8004" || line.hobex_responseCode === "8003")
        ) {
            this.currentOrder.remove_paymentline(line);
            this.numberBuffer.reset();
            return;
        }

        if (
            line?.payment_method_id?.use_payment_terminal === "hobex" &&
            line.transaction_id &&
            line.hobex_responseCode
        ) {
            this.env.services.dialog.add(AlertDialog, {
                title: "hobex Antwort",
                body: `Code: ${line.hobex_responseCode}\n${line.hobex_responseText || ""}`,
            });
            return;
        }

        if (line?.payment_method_id?.use_payment_terminal === "hobex" && line.transaction_id) {
            this.env.services.dialog.add(AlertDialog, {
                title: "ACHTUNG",
                body: "Die Zahlung muss am Terminal abgebrochen werden !",
            });
            return;
        }

        return super.deletePaymentLine(...arguments);
    },
});
