use anchor_lang::prelude::*;

use crate::errors::EarmarkError;
use crate::state::*;

#[derive(Accounts)]
pub struct RevokeRecipient<'info> {
    #[account(address = config.verifier @ EarmarkError::Unauthorized)]
    pub verifier: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [RECIPIENT_SEED, recipient.wallet.as_ref()],
        bump = recipient.bump
    )]
    pub recipient: Account<'info, Recipient>,
}

pub fn handler(ctx: Context<RevokeRecipient>) -> Result<()> {
    ctx.accounts.recipient.active = false;
    Ok(())
}
