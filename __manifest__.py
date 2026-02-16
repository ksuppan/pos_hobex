# -*- coding: utf-8 -*-
{
    'name': 'hobex Payment Terminal',
    'summary': 'hobex Payment Terminal Integration for Odoo POS',
    'version': '19.0.1.3.0',
    'category': 'Point of Sale',
    'sequence': 6,
    'website': 'https://github.com/callino/hobexr',
    'author': 'Wolfgang Pichler (Callino), Gerhard Baumgartner (Callino)',
    "license": "AGPL-3",
    'depends': ['point_of_sale'],
    'data': [
        'security/ir.model.access.csv',
        'views/res_config_settings_views.xml',
        'views/pos_payment_method.xml',
        'views/pos_payment.xml',
        'data/cron.xml',
    ],
    'images': [
        'static/description/banner.png',
    ],
    'assets': {
    'point_of_sale._assets_pos': [
        # JS (explicit)
        'pos_hobex/static/src/app/payment_hobex.js',
#        'pos_hobex/static/src/overrides/components/PaymentScreen/PaymentScreen.js',
        'pos_hobex/static/src/overrides/models/models.js',

        # POS QWeb (explicit)
        'pos_hobex/static/src/xml/ReceiptScreen/OrderReceipt.xml',

        # If you have styling files, add them explicitly here:
        # 'pos_hobex/static/src/**/*.scss',
        # 'pos_hobex/static/src/**/*.css',
    ],
    },
#    'assets': {
#        'point_of_sale.assets': [
#            'pos_hobex/static/src/**/*',
#            "pos_hobex/static/src/xml/ReceiptScreen/OrderReceipt.xml",
#        ],
#    },

    'installable': True,
    'auto_install': False,
}
