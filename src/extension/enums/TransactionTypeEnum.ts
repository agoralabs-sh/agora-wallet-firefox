enum TransactionTypeEnum {
  ApplicationClearState = 'application_clear_state',
  ApplicationCloseOut = 'application_close_out',
  ApplicationCreate = 'application_create',
  ApplicationDelete = 'application_delete',
  ApplicationNoOp = 'application_no_op',
  ApplicationOptIn = 'application_opt_in',
  ApplicationUpdate = 'application_update',
  ARC0200AssetApprove = 'arc0200_asset_approve',
  ARC0200AssetTransfer = 'arc0200_asset_transfer',
  AssetConfig = 'asset_config',
  AssetCreate = 'asset_create',
  AssetFreeze = 'asset_freeze',
  AssetDestroy = 'asset_destroy',
  AssetOptIn = 'asset_opt_in',
  AssetTransfer = 'asset_transfer',
  AssetUnfreeze = 'asset_unfreeze',
  KeyRegistrationOffline = 'key_registration_offline',
  KeyRegistrationOnline = 'key_registration_online',
  Payment = 'payment',
  Unknown = 'unknown',
}

export default TransactionTypeEnum;
