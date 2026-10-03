use anchor_lang::prelude::*;

declare_id!("GWaY7mkSSwBzK6KfSGEJa9EriyvyE5k25yZQ9q4PCfMf");

#[program]
pub mod earmark {
    use super::*;

    /// Placeholder so the workspace builds and tests run. Replaced by `init_config` in T01.
    pub fn ping(_ctx: Context<Ping>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Ping {}
