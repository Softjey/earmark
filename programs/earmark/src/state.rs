use anchor_lang::prelude::*;

pub const CONFIG_SEED: &[u8] = b"config";
pub const RECIPIENT_SEED: &[u8] = b"recipient";
pub const FUNDRAISER_SEED: &[u8] = b"fundraiser";
pub const VAULT_SEED: &[u8] = b"vault";
pub const DONATION_SEED: &[u8] = b"donation";
pub const DOCUMENT_SEED: &[u8] = b"document";

pub const MAX_NAME_LEN: usize = 64;
pub const MAX_REGISTRY_ID_LEN: usize = 32;
pub const MAX_METADATA_URI_LEN: usize = 128;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub verifier: Pubkey,
    pub mint: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Recipient {
    pub wallet: Pubkey,
    #[max_len(64)]
    pub name: String,
    #[max_len(32)]
    pub registry_id: String,
    pub verified_at: i64,
    pub active: bool,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum FundraiserStatus {
    PendingConfirmation,
    Active,
    Released,
    Cancelled,
}

#[account]
#[derive(InitSpace)]
pub struct Fundraiser {
    pub organizer: Pubkey,
    /// Wallet of the verified recipient (clinic, charity, relief organisation, ...).
    pub recipient: Pubkey,
    pub id: u64,
    pub target: u64,
    pub raised: u64,
    pub deadline: i64,
    pub document_hash: [u8; 32],
    #[max_len(128)]
    pub metadata_uri: String,
    pub status: FundraiserStatus,
    pub created_at: i64,
    pub bump: u8,
    pub vault_bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Donation {
    pub donor: Pubkey,
    pub amount: u64,
    pub refunded: bool,
    pub bump: u8,
}

/// Exists only to make each document hash usable once.
#[account]
#[derive(InitSpace)]
pub struct DocumentLock {
    pub fundraiser: Pubkey,
}
