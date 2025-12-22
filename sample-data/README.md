# Sample Data Files

Test için örnek veri dosyaları. Her biri farklı oyun türü için.

## Dosyalar

| Dosya | Format | Oyun Türü | Satır |
|-------|--------|-----------|-------|
| `puzzle_game_events.csv` | CSV | Puzzle | 13 |
| `user_cohorts.csv` | CSV | Genel | 12 |
| `battle_royale_matches.json` | JSON | Battle Royale | 10 |
| `idle_clicker_events.csv` | CSV | Idle/Clicker | 13 |
| `gacha_rpg_pulls.json` | JSON | Gacha RPG | 8 |
| `iap_transactions.csv` | CSV | Genel (IAP) | 10 |

## Column Örnekleri

### puzzle_game_events.csv
```
user_id, session_id, timestamp, event_type, level, moves_left, boosters_used, score, coins_spent
```

### battle_royale_matches.json
```json
{
  "matchId", "playerId", "timestamp", "mode", 
  "placement", "kills", "damage", "survivalTime", "weaponUsed"
}
```

### gacha_rpg_pulls.json
```json
{
  "pullId", "userId", "bannerName", "pullType",
  "gemsSpent", "timestamp", "results": [{rarity, charName}]
}
```

## Test Kullanımı

1. Upload sayfasına git
2. Herhangi bir dosyayı sürükle-bırak
3. Column mapping'i incele
4. Dashboard'da görselleştir
