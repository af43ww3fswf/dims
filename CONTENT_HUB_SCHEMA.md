# Required Content Hub members

Add these members to the Artwork entity definition. The names can be overridden through the External component's custom JSON configuration.

| Member | Type | Notes |
| --- | --- | --- |
| `WC.DimensionsData` | String, long | JSON representation of the repeatable dimension sets |
| `WC.DimensionsDescription` | String, long | Quantity and dimension notes |
| `WC.DimensionsComputedValue` | String, long | Generated output from included sets |
| `WC.DimensionsUseOverride` | Boolean | Defaults to `false` |
| `WC.DimensionsOverrideValue` | String, long | Complete replacement output |
| `WC.DimensionsOverrideReason` | String | Selected reason |
| `WC.DimensionsOverrideNote` | String, long | Supporting override note |
| `WC.DimensionsPresentableValue` | String, long | Final computed or overridden value for integrations |

Recommended defaults:

- `WC.DimensionsData`: `{\"sets\":[],\"notes\":\"\"}`
- `WC.DimensionsUseOverride`: `false`

For reporting or filtering individual sets, replace the JSON adapter with an `Artwork 1:n DimensionSet` entity repository. The React UI is deliberately independent of the persistence adapter.
