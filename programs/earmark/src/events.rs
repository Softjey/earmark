use anchor_lang::prelude::*;

#[event]
pub struct DonationMade {
    pub fundraiser: Pubkey,
    pub donor: Pubkey,
    /// Amount actually accepted (capped at `target - raised`).
    pub amount: u64,
    pub raised: u64,
}

#[event]
pub struct FundraiserReleased {
    pub fundraiser: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
}

#[event]
pub struct Refunded {
    pub fundraiser: Pubkey,
    pub donor: Pubkey,
    pub amount: u64,
}
