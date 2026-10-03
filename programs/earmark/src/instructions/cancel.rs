use anchor_lang::prelude::*;

use crate::errors::EarmarkError;
use crate::state::*;

#[derive(Accounts)]
pub struct Cancel<'info> {
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [FUNDRAISER_SEED, fundraiser.organizer.as_ref(), &fundraiser.id.to_le_bytes()],
        bump = fundraiser.bump
    )]
    pub fundraiser: Account<'info, Fundraiser>,
}

pub fn handler(ctx: Context<Cancel>) -> Result<()> {
    let fundraiser = &mut ctx.accounts.fundraiser;
    let signer = ctx.accounts.signer.key();
    require!(
        signer == fundraiser.recipient || signer == fundraiser.organizer,
        EarmarkError::Unauthorized
    );
    require!(
        matches!(
            fundraiser.status,
            FundraiserStatus::PendingConfirmation | FundraiserStatus::Active
        ),
        EarmarkError::NotCancellable
    );
    fundraiser.status = FundraiserStatus::Cancelled;
    Ok(())
}
