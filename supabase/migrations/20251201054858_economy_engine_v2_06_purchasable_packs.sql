/*
  # Economy Engine 2.0 - Purchasable Packs

  1. New Tables
    - `purchasable_packs` - Coin and energy packs for purchase

  2. Changes
    - Energy packs: ₱99-₱599
    - Coin packs: ₱99-₱599
    - Unlimited 24H energy: ₱149

  3. Security
    - Basic table creation
*/

DROP TABLE IF EXISTS purchasable_packs CASCADE;

CREATE TABLE purchasable_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    price INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO purchasable_packs (type, name, amount, price)
VALUES
('energy_pack', '+150 Energy', 150, 99),
('energy_pack', '+500 Energy', 500, 249),
('energy_pack', '+1500 Energy', 1500, 599),
('energy_pack', 'Unlimited 24H Energy', 99999, 149),
('coin_pack', '50 Coins', 50, 99),
('coin_pack', '150 Coins', 150, 249),
('coin_pack', '400 Coins', 400, 599);
