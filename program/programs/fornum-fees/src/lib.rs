use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("FeepnhCkEg516UeZS9mmsY3J2D7QKmLSG97DmWbZVEq3");

/// Fee vaults, one per mint
///
/// The whole point of this program is that a token's fees live in an account of
/// their own, derived from the mint. Nothing has to be attributed after the
/// fact: the vault balance is what that token earned, and it cannot be spent on
/// another token's claim because it is a different account.
///
/// Fees belong to a phone number, which cannot sign anything, so the number is
/// carried as a salted hash and our authority signs on its behalf once the
/// backend has checked the session. That makes the program custodial by design.
/// What it still guarantees on chain: the service share is bounded, one token's
/// money can never pay another token's claim, a vault always survives a claim,
/// and every handover and payout leaves an event behind.

pub const CONFIG_SEED: &[u8] = b"config";
pub const FEES_SEED: &[u8] = b"fees";
pub const VAULT_SEED: &[u8] = b"vault";

/// The most the service can ever take from a claim, 20 percent
///
/// A ceiling in code rather than a promise in a document: even a compromised
/// authority cannot set the share above this
pub const MAX_FEE_BPS: u16 = 2_000;

const BPS_DENOMINATOR: u128 = 10_000;

#[program]
pub mod fornum_fees {
    use super::*;

    /// One time setup: who signs, where the service share goes, how big it is
    pub fn initialize(ctx: Context<Initialize>, fee_bps: u16) -> Result<()> {
        require!(fee_bps <= MAX_FEE_BPS, FeeError::FeeTooHigh);

        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.treasury = ctx.accounts.treasury.key();
        config.fee_bps = fee_bps;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    /// Change the share, the treasury or the authority. Each one is optional
    pub fn configure(
        ctx: Context<Configure>,
        fee_bps: Option<u16>,
        treasury: Option<Pubkey>,
        authority: Option<Pubkey>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;

        if let Some(bps) = fee_bps {
            require!(bps <= MAX_FEE_BPS, FeeError::FeeTooHigh);
            config.fee_bps = bps;
        }
        if let Some(treasury) = treasury {
            config.treasury = treasury;
        }
        if let Some(authority) = authority {
            require!(authority != Pubkey::default(), FeeError::EmptyAuthority);
            config.authority = authority;
        }

        Ok(())
    }

    /// Open the vault for a mint and say whose number the fees belong to
    ///
    /// Deposits need no instruction at all: the vault is a plain system account,
    /// so whatever routes trading fees simply transfers SOL to its address
    pub fn register(ctx: Context<Register>, recipient: [u8; 32]) -> Result<()> {
        require!(recipient != [0u8; 32], FeeError::EmptyRecipient);

        let fees = &mut ctx.accounts.fees;
        fees.mint = ctx.accounts.mint.key();
        fees.recipient = recipient;
        fees.claimed = 0;
        fees.handovers = 0;
        fees.created_at = Clock::get()?.unix_timestamp;
        fees.bump = ctx.bumps.fees;
        fees.vault_bump = ctx.bumps.vault;

        // Fund the vault to rent exemption up front. It is what makes
        // `balance - rent` an honest claimable figure from the very first
        // deposit, and it means a claim can drain the earnings without killing
        // the account
        let floor = Rent::get()?.minimum_balance(0);
        let missing = floor.saturating_sub(ctx.accounts.vault.lamports());
        if missing > 0 {
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.key(),
                    system_program::Transfer {
                        from: ctx.accounts.authority.to_account_info(),
                        to: ctx.accounts.vault.to_account_info(),
                    },
                ),
                missing,
            )?;
        }

        emit!(Registered {
            mint: fees.mint,
            vault: ctx.accounts.vault.key(),
            recipient,
        });
        Ok(())
    }

    /// Hand the fees of a token to a different number
    ///
    /// One way on purpose. The new holder can pass them on again, the old one
    /// has nothing left to pass
    pub fn assign(ctx: Context<Assign>, new_recipient: [u8; 32]) -> Result<()> {
        require!(new_recipient != [0u8; 32], FeeError::EmptyRecipient);

        let fees = &mut ctx.accounts.fees;
        let previous = fees.recipient;
        require!(new_recipient != previous, FeeError::SameRecipient);

        fees.recipient = new_recipient;
        fees.handovers = fees.handovers.saturating_add(1);

        emit!(Assigned {
            mint: fees.mint,
            from: previous,
            to: new_recipient,
        });
        Ok(())
    }

    /// Pay out of one token's vault to an address the claimer gave us
    ///
    /// The service share comes off here rather than in a second transaction, so
    /// there is no window in which the split can be skipped
    pub fn claim(ctx: Context<Claim>, amount: u64) -> Result<()> {
        require!(
            ctx.accounts.destination.key() != ctx.accounts.vault.key(),
            FeeError::InvalidDestination
        );

        let floor = Rent::get()?.minimum_balance(0);
        let available = ctx.accounts.vault.lamports().saturating_sub(floor);

        require!(amount > 0, FeeError::NothingToClaim);
        require!(amount <= available, FeeError::AmountTooLarge);

        // u128 so the multiply cannot overflow before the divide brings it back
        let cut = u64::try_from(
            (amount as u128)
                .checked_mul(ctx.accounts.config.fee_bps as u128)
                .ok_or(FeeError::MathOverflow)?
                / BPS_DENOMINATOR,
        )
        .map_err(|_| FeeError::MathOverflow)?;
        let payout = amount.checked_sub(cut).ok_or(FeeError::MathOverflow)?;

        let mint = ctx.accounts.fees.mint;
        let vault_bump = ctx.accounts.fees.vault_bump;
        let seeds: &[&[u8]] = &[VAULT_SEED, mint.as_ref(), &[vault_bump]];
        let signer: &[&[&[u8]]] = &[seeds];

        if payout > 0 {
            system_program::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.key(),
                    system_program::Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.destination.to_account_info(),
                    },
                    signer,
                ),
                payout,
            )?;
        }

        if cut > 0 {
            system_program::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.key(),
                    system_program::Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.treasury.to_account_info(),
                    },
                    signer,
                ),
                cut,
            )?;
        }

        let fees = &mut ctx.accounts.fees;
        fees.claimed = fees
            .claimed
            .checked_add(amount)
            .ok_or(FeeError::MathOverflow)?;

        emit!(Claimed {
            mint,
            recipient: fees.recipient,
            destination: ctx.accounts.destination.key(),
            amount,
            fee: cut,
        });
        Ok(())
    }
}

/* ------------------------------------------------------------------ */
/* Accounts                                                            */
/* ------------------------------------------------------------------ */

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: only its address is kept, it never signs and is never read
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Configure<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority @ FeeError::Unauthorized
    )]
    pub config: Account<'info, Config>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Register<'info> {
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority @ FeeError::Unauthorized
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: used only as the seed that ties a vault to one token, never read
    pub mint: UncheckedAccount<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + FeeAccount::INIT_SPACE,
        seeds = [FEES_SEED, mint.key().as_ref()],
        bump
    )]
    pub fees: Account<'info, FeeAccount>,

    /// CHECK: SOL only PDA with no data, pinned by its seeds. Unchecked here
    /// because it does not exist until this instruction funds it
    #[account(mut, seeds = [VAULT_SEED, mint.key().as_ref()], bump)]
    pub vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Assign<'info> {
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority @ FeeError::Unauthorized
    )]
    pub config: Account<'info, Config>,

    pub authority: Signer<'info>,

    #[account(mut, seeds = [FEES_SEED, fees.mint.as_ref()], bump = fees.bump)]
    pub fees: Account<'info, FeeAccount>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority @ FeeError::Unauthorized,
        has_one = treasury @ FeeError::WrongTreasury
    )]
    pub config: Account<'info, Config>,

    pub authority: Signer<'info>,

    #[account(mut, seeds = [FEES_SEED, fees.mint.as_ref()], bump = fees.bump)]
    pub fees: Account<'info, FeeAccount>,

    /// Holds only this mint's fees, which is what makes the amount self evident
    #[account(mut, seeds = [VAULT_SEED, fees.mint.as_ref()], bump = fees.vault_bump)]
    pub vault: SystemAccount<'info>,

    /// CHECK: wherever the claimer asked us to send it
    #[account(mut)]
    pub destination: UncheckedAccount<'info>,

    /// CHECK: pinned to config.treasury by has_one
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    /// Service share of a claim, in basis points, capped by MAX_FEE_BPS
    pub fee_bps: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct FeeAccount {
    pub mint: Pubkey,
    /// Salted hash of the phone number the fees belong to. Never the number
    pub recipient: [u8; 32],
    /// Paid out so far, gross of the service share. For display and audit
    pub claimed: u64,
    pub handovers: u16,
    pub created_at: i64,
    pub bump: u8,
    pub vault_bump: u8,
}

/* ------------------------------------------------------------------ */
/* Events, which is how the site learns without polling every account  */
/* ------------------------------------------------------------------ */

#[event]
pub struct Registered {
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub recipient: [u8; 32],
}

#[event]
pub struct Assigned {
    pub mint: Pubkey,
    pub from: [u8; 32],
    pub to: [u8; 32],
}

#[event]
pub struct Claimed {
    pub mint: Pubkey,
    pub recipient: [u8; 32],
    pub destination: Pubkey,
    pub amount: u64,
    pub fee: u64,
}

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

#[error_code]
pub enum FeeError {
    #[msg("Only the configured authority can do this")]
    Unauthorized,
    #[msg("The service share cannot go above 20 percent")]
    FeeTooHigh,
    #[msg("The treasury does not match the one in config")]
    WrongTreasury,
    #[msg("A recipient hash of all zeroes is not a recipient")]
    EmptyRecipient,
    #[msg("Those fees already belong to that number")]
    SameRecipient,
    #[msg("Handing the authority to nobody would lock the program")]
    EmptyAuthority,
    #[msg("This vault has nothing to pay out")]
    NothingToClaim,
    #[msg("More than this vault can part with")]
    AmountTooLarge,
    #[msg("The vault cannot pay itself")]
    InvalidDestination,
    #[msg("The amount did not fit")]
    MathOverflow,
}
