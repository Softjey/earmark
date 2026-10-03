use anchor_lang::prelude::*;

use crate::errors::EarmarkError;
use crate::state::*;

#[derive(Accounts)]
pub struct ConfirmFundraiser<'info> {
    #[account(address = fundraiser.recipient @ EarmarkError::Unauthorized)]
    pub recipient_wallet: Signer<'info>,
    #[account(
        mut,
        seeds = [FUNDRAISER_SEED, fundraiser.organizer.as_ref(), &fundraiser.id.to_le_bytes()],
        bump = fundraiser.bump
    )]
    pub fundraiser: Account<'info, Fundraiser>,
}

pub fn handler(ctx: Context<ConfirmFundraiser>) -> Result<()> {
    let fundraiser = &mut ctx.accounts.fundraiser;
    require!(
        fundraiser.status == FundraiserStatus::PendingConfirmation,
        EarmarkError::NotPending
    );
    fundraiser.status = FundraiserStatus::Active;
    Ok(())
}
