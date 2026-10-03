use anchor_lang::prelude::*;

use crate::errors::EarmarkError;
use crate::state::*;

#[derive(Accounts)]
pub struct VerifyRecipient<'info> {
    #[account(mut, address = config.verifier @ EarmarkError::Unauthorized)]
    pub verifier: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    /// CHECK: only used as the recipient's wallet address
    pub wallet: UncheckedAccount<'info>,
    #[account(
        init,
        payer = verifier,
        space = 8 + Recipient::INIT_SPACE,
        seeds = [RECIPIENT_SEED, wallet.key().as_ref()],
        bump
    )]
    pub recipient: Account<'info, Recipient>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<VerifyRecipient>, name: String, registry_id: String) -> Result<()> {
    require!(
        name.len() <= MAX_NAME_LEN && registry_id.len() <= MAX_REGISTRY_ID_LEN,
        EarmarkError::FieldTooLong
    );
    let recipient = &mut ctx.accounts.recipient;
    recipient.wallet = ctx.accounts.wallet.key();
    recipient.name = name;
    recipient.registry_id = registry_id;
    recipient.verified_at = Clock::get()?.unix_timestamp;
    recipient.active = true;
    recipient.bump = ctx.bumps.recipient;
    Ok(())
}
