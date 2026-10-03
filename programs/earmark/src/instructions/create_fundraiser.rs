use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::errors::EarmarkError;
use crate::state::*;

#[derive(Accounts)]
#[instruction(id: u64, target: u64, deadline: i64, quote_hash: [u8; 32])]
pub struct CreateFundraiser<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Box<Account<'info, Config>>,
    /// CHECK: the recipient's wallet; its `Recipient` account is validated by hand in the handler
    /// so that an unverified wallet fails with `RecipientNotVerified`.
    pub recipient_wallet: UncheckedAccount<'info>,
    /// CHECK: PDA derived from the wallet; owner, discriminator and `active` are checked in the handler.
    #[account(seeds = [RECIPIENT_SEED, recipient_wallet.key().as_ref()], bump)]
    pub recipient: UncheckedAccount<'info>,
    #[account(
        init,
        payer = organizer,
        space = 8 + Fundraiser::INIT_SPACE,
        seeds = [FUNDRAISER_SEED, organizer.key().as_ref(), &id.to_le_bytes()],
        bump
    )]
    pub fundraiser: Box<Account<'info, Fundraiser>>,
    #[account(
        init,
        payer = organizer,
        seeds = [VAULT_SEED, fundraiser.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = fundraiser
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    /// CHECK: PDA created by hand in the handler so that reuse fails with `QuoteAlreadyUsed`.
    #[account(mut, seeds = [QUOTE_SEED, quote_hash.as_ref()], bump)]
    pub quote_lock: UncheckedAccount<'info>,
    #[account(address = config.mint)]
    pub mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateFundraiser>,
    id: u64,
    target: u64,
    deadline: i64,
    quote_hash: [u8; 32],
    metadata_uri: String,
) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let program_id = ctx.program_id;

    // Recipient must exist, be ours and be active.
    let recipient_info = ctx.accounts.recipient.to_account_info();
    require!(
        recipient_info.owner == program_id,
        EarmarkError::RecipientNotVerified
    );
    let recipient = Recipient::try_deserialize(&mut &recipient_info.try_borrow_data()?[..])
        .map_err(|_| EarmarkError::RecipientNotVerified)?;
    require!(recipient.active, EarmarkError::RecipientNotVerified);

    require!(target > 0, EarmarkError::InvalidTarget);
    require!(deadline > now, EarmarkError::DeadlineInPast);
    require!(
        metadata_uri.len() <= MAX_METADATA_URI_LEN,
        EarmarkError::FieldTooLong
    );

    // Quote lock: created once per quote hash.
    let quote_info = ctx.accounts.quote_lock.to_account_info();
    require!(
        quote_info.owner != program_id,
        EarmarkError::QuoteAlreadyUsed
    );
    let space = 8 + QuoteLock::INIT_SPACE;
    let bump = ctx.bumps.quote_lock;
    system_program::create_account(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.key(),
            system_program::CreateAccount {
                from: ctx.accounts.organizer.to_account_info(),
                to: quote_info.clone(),
            },
            &[&[QUOTE_SEED, quote_hash.as_ref(), &[bump]]],
        ),
        Rent::get()?.minimum_balance(space),
        space as u64,
        program_id,
    )?;
    let fundraiser_key = ctx.accounts.fundraiser.key();
    {
        let mut data = quote_info.try_borrow_mut_data()?;
        data[..8].copy_from_slice(QuoteLock::DISCRIMINATOR);
        QuoteLock {
            fundraiser: fundraiser_key,
        }
        .serialize(&mut &mut data[8..])?;
    }

    let fundraiser = &mut ctx.accounts.fundraiser;
    fundraiser.organizer = ctx.accounts.organizer.key();
    fundraiser.recipient = ctx.accounts.recipient_wallet.key();
    fundraiser.id = id;
    fundraiser.target = target;
    fundraiser.raised = 0;
    fundraiser.deadline = deadline;
    fundraiser.quote_hash = quote_hash;
    fundraiser.metadata_uri = metadata_uri;
    fundraiser.status = FundraiserStatus::PendingConfirmation;
    fundraiser.created_at = now;
    fundraiser.bump = ctx.bumps.fundraiser;
    fundraiser.vault_bump = ctx.bumps.vault;
    Ok(())
}
