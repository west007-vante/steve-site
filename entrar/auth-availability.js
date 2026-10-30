export function accountServiceReady(session,bootstrap){return session?.authReady!==false&&bootstrap?.authReady!==false&&bootstrap?.commercialStatus!=='ledger_unavailable'&&bootstrap?.capabilities?.auth===true;}
export function providerCanSubmit({accountReady,explicitLegacy,firebaseAvailable}){return accountReady===true&&(explicitLegacy===true||firebaseAvailable===true);}
