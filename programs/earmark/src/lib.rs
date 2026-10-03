use anchor_lang::prelude::*;

declare_id!("C7q4APaxNnmqsaF2dMMJahJuk2bTu2DC9RuDw3ixfzAz");

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
