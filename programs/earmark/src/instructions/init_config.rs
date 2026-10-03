use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::state::*;

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(mut)]
    pub deployer: Signer<'info>,
    #[account(
        init,
        payer = deployer,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitConfig>, verifier: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.verifier = verifier;
    config.mint = ctx.accounts.mint.key();
    config.bump = ctx.bumps.config;
    Ok(())
}
