/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { PosPayment } from "@point_of_sale/app/models/pos_payment";

patch(PosPayment.prototype, {
    setup() {
        super.setup(...arguments);

        // Hobex fields: ensure they always exist to prevent undefined access
        this.hobex_receipt = this.hobex_receipt ?? false;
        this.hobex_approvalCode = this.hobex_approvalCode ?? false;
        this.hobex_actionCode = this.hobex_actionCode ?? false;
        this.hobex_aid = this.hobex_aid ?? false;
        this.hobex_reference = this.hobex_reference ?? false;
        this.hobex_tid = this.hobex_tid ?? false;
        this.hobex_transactionId = this.hobex_transactionId ?? false;
        this.hobex_transactionDate = this.hobex_transactionDate ?? false;
        this.hobex_cardNumber = this.hobex_cardNumber ?? false;
        this.hobex_cardExpiry = this.hobex_cardExpiry ?? false;
        this.hobex_brand = this.hobex_brand ?? false;
        this.hobex_cardIssuer = this.hobex_cardIssuer ?? false;
        this.hobex_transactionType = this.hobex_transactionType ?? false;
        this.hobex_responseCode = this.hobex_responseCode ?? false;
        this.hobex_responseText = this.hobex_responseText ?? false;
        this.hobex_cvm = this.hobex_cvm ?? false;
    },

    export_as_JSON() {
        const json = super.export_as_JSON(...arguments);
        if (!json) return json;

        json.hobex_receipt = this.hobex_receipt;
        json.hobex_approvalCode = this.hobex_approvalCode;
        json.hobex_actionCode = this.hobex_actionCode;
        json.hobex_aid = this.hobex_aid;
        json.hobex_reference = this.hobex_reference;
        json.hobex_tid = this.hobex_tid;
        json.hobex_transactionId = this.hobex_transactionId;
        json.hobex_transactionDate = this.hobex_transactionDate;
        json.hobex_cardNumber = this.hobex_cardNumber;
        json.hobex_cardExpiry = this.hobex_cardExpiry;
        json.hobex_brand = this.hobex_brand;
        json.hobex_cardIssuer = this.hobex_cardIssuer;
        json.hobex_transactionType = this.hobex_transactionType;
        json.hobex_responseCode = this.hobex_responseCode;
        json.hobex_responseText = this.hobex_responseText;
        json.hobex_cvm = this.hobex_cvm;

        return json;
    },

    init_from_JSON(json) {
        super.init_from_JSON(...arguments);

        this.hobex_receipt = json.hobex_receipt ?? false;
        this.hobex_approvalCode = json.hobex_approvalCode ?? false;
        this.hobex_actionCode = json.hobex_actionCode ?? false;
        this.hobex_aid = json.hobex_aid ?? false;
        this.hobex_reference = json.hobex_reference ?? false;
        this.hobex_tid = json.hobex_tid ?? false;
        this.hobex_transactionId = json.hobex_transactionId ?? false;
        this.hobex_transactionDate = json.hobex_transactionDate ?? false;
        this.hobex_cardNumber = json.hobex_cardNumber ?? false;
        this.hobex_cardExpiry = json.hobex_cardExpiry ?? false;
        this.hobex_brand = json.hobex_brand ?? false;
        this.hobex_cardIssuer = json.hobex_cardIssuer ?? false;
        this.hobex_transactionType = json.hobex_transactionType ?? false;
        this.hobex_responseCode = json.hobex_responseCode ?? false;
        this.hobex_responseText = json.hobex_responseText ?? false;
        this.hobex_cvm = json.hobex_cvm ?? false;
    },

    export_for_printing() {
        const data = super.export_for_printing(...arguments);

        // Make hobex fields available in receipt rendering
        data.hobex_transactionId = this.hobex_transactionId;
        data.hobex_tid = this.hobex_tid;
        data.hobex_receipt = this.hobex_receipt;
        data.hobex_cardIssuer = this.hobex_cardIssuer;
        data.hobex_cardNumber = this.hobex_cardNumber;
        data.hobex_transactionType = this.hobex_transactionType;
        data.hobex_approvalCode = this.hobex_approvalCode;
        data.hobex_aid = this.hobex_aid;
        data.hobex_responseCode = this.hobex_responseCode;
        data.hobex_responseText = this.hobex_responseText;
        data.hobex_actionCode = this.hobex_actionCode;
        data.hobex_cvm = this.hobex_cvm;

        return data;
    },
});
