#[test]
fn base58_to_wallet() {
    println!("Enter your name:");
    let stdin = io::stdin();
    let base58 = stdin.lock().lines().next().unwrap().unwrap();
    let wallet = bs58::decode(base58).into_vec().unwrap();
    println!("{:?}", wallet);
}

#[test]
fn wallet_to_base58() {
    let wallet: Vec<u8> = vec![14,184,152,245,252,145,243,157,191,127,95,111,123,189,65,189,80,173,43,238,110,23,213,52,189,181,16,12,9,193,110,15,217,12,99,36,82,95,145,140,116,173,130,213,220,255,8,116,19,180,66,200,44,221,90,176,74,105,74,88,163,104,47,1];
    let base58 = bs58::encode(wallet).into_string();
    println!("{:?}", base58);
}