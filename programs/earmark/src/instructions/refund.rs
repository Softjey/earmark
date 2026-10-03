use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::errors::EarmarkError;
use crate::events::*;
use crate::state::*;

#[derive(Accounts)]
pub struct Refund<'info> {
    pub donor: Signer<'info>,
    #[account(
        seeds = [FUNDRAISER_SEED, fundraiser.organizer.as_ref(), &fundraiser.id.to_le_bytes()],
        bump = fundraiser.bump
    )]
    pub fundraiser: Account<'info, Fundraiser>,
    #[account(mut, seeds = [VAULT_SEED, fundraiser.key().as_ref()], bump = fundraiser.vault_bump)]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [DONATION_SEED, fundraiser.key().as_ref(), donor.key().as_ref()],
        bump = donation.bump,
        has_one = donor
    )]
    pub donation: Account<'info, Donation>,
    /// The donor's own token account: the only possible destination.
    #[account(mut, token::mint = vault.mint, token::authority = donor)]
    pub donor_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Refund>) -> Result<()> {
    let fundraiser = &ctx.accounts.fundraiser;
    let expired = fundraiser.status == FundraiserStatus::Active
        && Clock::get()?.unix_timestamp >= fundraiser.deadline;
    require!(
        fundraiser.status == FundraiserStatus::Cancelled || expired,
        EarmarkError::NotRefundable
    );
    require!(!ctx.accounts.donation.refunded, EarmarkError::AlreadyRefunded);

    let amount = ctx.accounts.donation.amount;
    ctx.accounts.donation.refunded = true;

    let id_bytes = fundraiser.id.to_le_bytes();
    let seeds: &[&[u8]] = &[
        FUNDRAISER_SEED,
        fundraiser.organizer.as_ref(),
        &id_bytes,
        &[fundraiser.bump],
    ];
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.donor_token.to_account_info(),
                authority: fundraiser.to_account_info(),
            },
            &[seeds],
        ),
        amount,
    )?;
    emit!(Refunded {
        fundraiser: fundraiser.key(),
        donor: ctx.accounts.donor.key(),
        amount,
    });
    Ok(())
}
