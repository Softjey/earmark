/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/earmark.json`.
 */
export type Earmark = {
  "address": "GWaY7mkSSwBzK6KfSGEJa9EriyvyE5k25yZQ9q4PCfMf",
  "metadata": {
    "name": "earmark",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "cancel",
      "discriminator": [
        232,
        219,
        223,
        41,
        219,
        236,
        220,
        190
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        },
        {
          "name": "fundraiser",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  117,
                  110,
                  100,
                  114,
                  97,
                  105,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "fundraiser.organizer",
                "account": "fundraiser"
              },
              {
                "kind": "account",
                "path": "fundraiser.id",
                "account": "fundraiser"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "confirmFundraiser",
      "discriminator": [
        118,
        146,
        26,
        120,
        88,
        168,
        52,
        225
      ],
      "accounts": [
        {
          "name": "recipientWallet",
          "signer": true
        },
        {
          "name": "fundraiser",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  117,
                  110,
                  100,
                  114,
                  97,
                  105,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "fundraiser.organizer",
                "account": "fundraiser"
              },
              {
                "kind": "account",
                "path": "fundraiser.id",
                "account": "fundraiser"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "createFundraiser",
      "discriminator": [
        44,
        23,
        112,
        64,
        124,
        195,
        160,
        251
      ],
      "accounts": [
        {
          "name": "organizer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "recipientWallet",
          "docs": [
            "so that an unverified wallet fails with `RecipientNotVerified`."
          ]
        },
        {
          "name": "recipient",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  99,
                  105,
                  112,
                  105,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "recipientWallet"
              }
            ]
          }
        },
        {
          "name": "fundraiser",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  117,
                  110,
                  100,
                  114,
                  97,
                  105,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "organizer"
              },
              {
                "kind": "arg",
                "path": "id"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "fundraiser"
              }
            ]
          }
        },
        {
          "name": "documentLock",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  111,
                  99,
                  117,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "documentHash"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "u64"
        },
        {
          "name": "target",
          "type": "u64"
        },
        {
          "name": "deadline",
          "type": "i64"
        },
        {
          "name": "documentHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "metadataUri",
          "type": "string"
        }
      ]
    },
    {
      "name": "donate",
      "discriminator": [
        121,
        186,
        218,
        211,
        73,
        70,
        196,
        180
      ],
      "accounts": [
        {
          "name": "donor",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "fundraiser",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  117,
                  110,
                  100,
                  114,
                  97,
                  105,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "fundraiser.organizer",
                "account": "fundraiser"
              },
              {
                "kind": "account",
                "path": "fundraiser.id",
                "account": "fundraiser"
              }
            ]
          }
        },
        {
          "name": "recipient",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  99,
                  105,
                  112,
                  105,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "fundraiser.recipient",
                "account": "fundraiser"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "fundraiser"
              }
            ]
          }
        },
        {
          "name": "donorToken",
          "writable": true
        },
        {
          "name": "recipientWallet"
        },
        {
          "name": "recipientToken",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "recipientWallet"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "donation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  111,
                  110,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "fundraiser"
              },
              {
                "kind": "account",
                "path": "donor"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initConfig",
      "discriminator": [
        23,
        235,
        115,
        232,
        168,
        96,
        1,
        231
      ],
      "accounts": [
        {
          "name": "deployer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "verifier",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "refund",
      "discriminator": [
        2,
        96,
        183,
        251,
        63,
        208,
        46,
        46
      ],
      "accounts": [
        {
          "name": "caller",
          "docs": [
            "Anyone can trigger a refund (the donor, a keeper bot, a friend). It only pays the",
            "transaction fee; it has no say over where the tokens go."
          ],
          "signer": true
        },
        {
          "name": "donor",
          "docs": [
            "`donor_token` through the token authority, so the tokens can only reach this donor."
          ],
          "relations": [
            "donation"
          ]
        },
        {
          "name": "fundraiser",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  117,
                  110,
                  100,
                  114,
                  97,
                  105,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "fundraiser.organizer",
                "account": "fundraiser"
              },
              {
                "kind": "account",
                "path": "fundraiser.id",
                "account": "fundraiser"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "fundraiser"
              }
            ]
          }
        },
        {
          "name": "donation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  111,
                  110,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "fundraiser"
              },
              {
                "kind": "account",
                "path": "donor"
              }
            ]
          }
        },
        {
          "name": "donorToken",
          "docs": [
            "The donor's own token account: the only possible destination."
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "revokeRecipient",
      "discriminator": [
        135,
        0,
        161,
        228,
        156,
        230,
        136,
        92
      ],
      "accounts": [
        {
          "name": "verifier",
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "recipient",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  99,
                  105,
                  112,
                  105,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "recipient.wallet",
                "account": "recipient"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "verifyRecipient",
      "discriminator": [
        99,
        140,
        106,
        41,
        1,
        182,
        100,
        142
      ],
      "accounts": [
        {
          "name": "verifier",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "wallet"
        },
        {
          "name": "recipient",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  99,
                  105,
                  112,
                  105,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "wallet"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "registryId",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "donation",
      "discriminator": [
        189,
        210,
        54,
        77,
        216,
        85,
        7,
        68
      ]
    },
    {
      "name": "fundraiser",
      "discriminator": [
        167,
        106,
        143,
        202,
        135,
        131,
        204,
        196
      ]
    },
    {
      "name": "recipient",
      "discriminator": [
        80,
        186,
        47,
        196,
        232,
        251,
        21,
        148
      ]
    }
  ],
  "events": [
    {
      "name": "donationMade",
      "discriminator": [
        181,
        70,
        105,
        197,
        198,
        205,
        198,
        197
      ]
    },
    {
      "name": "fundraiserReleased",
      "discriminator": [
        87,
        219,
        162,
        193,
        173,
        128,
        148,
        239
      ]
    },
    {
      "name": "refunded",
      "discriminator": [
        35,
        103,
        149,
        246,
        196,
        123,
        221,
        99
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "recipientNotVerified",
      "msg": "Recipient is not a verified, active organisation"
    },
    {
      "code": 6001,
      "name": "documentAlreadyUsed",
      "msg": "This supporting document has already been used for another fundraiser"
    },
    {
      "code": 6002,
      "name": "invalidTarget",
      "msg": "Target must be greater than zero"
    },
    {
      "code": 6003,
      "name": "deadlineInPast",
      "msg": "Deadline must be in the future"
    },
    {
      "code": 6004,
      "name": "notPending",
      "msg": "Fundraiser is not pending confirmation"
    },
    {
      "code": 6005,
      "name": "notActive",
      "msg": "Fundraiser is not active"
    },
    {
      "code": 6006,
      "name": "deadlinePassed",
      "msg": "Fundraiser deadline has passed"
    },
    {
      "code": 6007,
      "name": "notRefundable",
      "msg": "Fundraiser is not refundable"
    },
    {
      "code": 6008,
      "name": "alreadyRefunded",
      "msg": "Donation was already refunded"
    },
    {
      "code": 6009,
      "name": "unauthorized",
      "msg": "Signer is not authorized for this action"
    },
    {
      "code": 6010,
      "name": "fieldTooLong",
      "msg": "A text field is too long"
    },
    {
      "code": 6011,
      "name": "invalidAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6012,
      "name": "notCancellable",
      "msg": "Fundraiser can no longer be cancelled"
    }
  ],
  "types": [
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "verifier",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "donation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "donor",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "refunded",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "donationMade",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "fundraiser",
            "type": "pubkey"
          },
          {
            "name": "donor",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "docs": [
              "Amount actually accepted (capped at `target - raised`)."
            ],
            "type": "u64"
          },
          {
            "name": "raised",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "fundraiser",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "organizer",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "docs": [
              "Wallet of the verified recipient (clinic, charity, relief organisation, ...)."
            ],
            "type": "pubkey"
          },
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "target",
            "type": "u64"
          },
          {
            "name": "raised",
            "type": "u64"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "documentHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "metadataUri",
            "type": "string"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "fundraiserStatus"
              }
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "fundraiserReleased",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "fundraiser",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "fundraiserStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pendingConfirmation"
          },
          {
            "name": "active"
          },
          {
            "name": "released"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "recipient",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "registryId",
            "type": "string"
          },
          {
            "name": "verifiedAt",
            "type": "i64"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "refunded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "fundraiser",
            "type": "pubkey"
          },
          {
            "name": "donor",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
