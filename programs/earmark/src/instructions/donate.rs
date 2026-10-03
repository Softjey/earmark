use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::errors::EarmarkError;
use crate::events::*;
use crate::state::*;

#[derive(Accounts)]
pub struct Donate<'info> {
    #[account(mut)]
    pub donor: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Box<Account<'info, Config>>,
    #[account(
        mut,
        seeds = [FUNDRAISER_SEED, fundraiser.organizer.as_ref(), &fundraiser.id.to_le_bytes()],
        bump = fundraiser.bump
    )]
    pub fundraiser: Box<Account<'info, Fundraiser>>,
    #[account(
        seeds = [RECIPIENT_SEED, fundraiser.recipient.as_ref()],
        bump = recipient.bump,
        constraint = recipient.active @ EarmarkError::RecipientNotVerified
    )]
    pub recipient: Box<Account<'info, Recipient>>,
    #[account(mut, seeds = [VAULT_SEED, fundraiser.key().as_ref()], bump = fundraiser.vault_bump)]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(mut, token::mint = mint, token::authority = donor)]
    pub donor_token: Box<Account<'info, TokenAccount>>,
    /// CHECK: must be the fundraiser's recipient wallet
    #[account(address = fundraiser.recipient)]
    pub recipient_wallet: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = donor,
        associated_token::mint = mint,
        associated_token::authority = recipient_wallet
    )]
    pub recipient_token: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = donor,
        space = 8 + Donation::INIT_SPACE,
        seeds = [DONATION_SEED, fundraiser.key().as_ref(), donor.key().as_ref()],
        bump
    )]
    pub donation: Box<Account<'info, Donation>>,
    #[account(address = config.mint)]
    pub mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Donate>, amount: u64) -> Result<()> {
    require!(amount > 0, EarmarkError::InvalidAmount);

    let fundraiser = &mut ctx.accounts.fundraiser;
    require!(
        fundraiser.status == FundraiserStatus::Active,
        EarmarkError::NotActive
    );
    require!(
        Clock::get()?.unix_timestamp < fundraiser.deadline,
        EarmarkError::DeadlinePassed
    );

    // Over-donation is capped, never rejected.
    let accepted = amount.min(fundraiser.target - fundraiser.raised);

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.donor_token.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.donor.to_account_info(),
            },
        ),
        accepted,
    )?;

    let donation = &mut ctx.accounts.donation;
    if donation.donor == Pubkey::default() {
        donation.donor = ctx.accounts.donor.key();
        donation.bump = ctx.bumps.donation;
    }
    donation.amount = donation
        .amount
        .checked_add(accepted)
        .ok_or(EarmarkError::InvalidAmount)?;
    fundraiser.raised += accepted;

    let fundraiser_key = fundraiser.key();
    emit!(DonationMade {
        fundraiser: fundraiser_key,
        donor: ctx.accounts.donor.key(),
        amount: accepted,
        raised: fundraiser.raised,
    });

    if fundraiser.raised == fundraiser.target {
        // Target hit: pay out the whole vault to the recipient's token account, same tx.
        ctx.accounts.vault.reload()?;
        let payout = ctx.accounts.vault.amount;
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
                    to: ctx.accounts.recipient_token.to_account_info(),
                    authority: fundraiser.to_account_info(),
                },
                &[seeds],
            ),
            payout,
        )?;
        fundraiser.status = FundraiserStatus::Released;
        emit!(FundraiserReleased {
            fundraiser: fundraiser_key,
            recipient: fundraiser.recipient,
            amount: payout,
        });
    }
    Ok(())
}
