from odoo import fields, models

class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    hobex_enabled = fields.Boolean(
        string="HOBEX Payment Terminal",
        config_parameter="pos_hobex.enabled",
        help="Enable HOBEX as a POS payment terminal option in payment methods.",
    )
