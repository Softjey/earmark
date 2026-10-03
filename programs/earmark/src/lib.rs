use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("GWaY7mkSSwBzK6KfSGEJa9EriyvyE5k25yZQ9q4PCfMf");

#[program]
pub mod earmark {
    use super::*;

    pub fn init_config(ctx: Context<InitConfig>, verifier: Pubkey) -> Result<()> {
        init_config::handler(ctx, verifier)
    }

    pub fn verify_recipient(
        ctx: Context<VerifyRecipient>,
        name: String,
        registry_id: String,
    ) -> Result<()> {
        verify_recipient::handler(ctx, name, registry_id)
    }

    pub fn revoke_recipient(ctx: Context<RevokeRecipient>) -> Result<()> {
        revoke_recipient::handler(ctx)
    }

    pub fn create_fundraiser(
        ctx: Context<CreateFundraiser>,
        id: u64,
        target: u64,
        deadline: i64,
        document_hash: [u8; 32],
        metadata_uri: String,
    ) -> Result<()> {
        create_fundraiser::handler(ctx, id, target, deadline, document_hash, metadata_uri)
    }

    pub fn confirm_fundraiser(ctx: Context<ConfirmFundraiser>) -> Result<()> {
        confirm_fundraiser::handler(ctx)
    }

    pub fn donate(ctx: Context<Donate>, amount: u64) -> Result<()> {
        donate::handler(ctx, amount)
    }

    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        cancel::handler(ctx)
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        refund::handler(ctx)
    }
}
