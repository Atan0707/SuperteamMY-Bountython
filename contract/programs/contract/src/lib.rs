use anchor_lang::prelude::*;

declare_id!("8mjhvekaFTdx3zhQm5WBwRBSXkhd1E36K4YogLTPj6bT");

#[program]
pub mod contract {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
