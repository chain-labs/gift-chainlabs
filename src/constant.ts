export const sender_private_key = process.env.NEXT_PUBLIC_MAIN_PRIVATE_KEY;

export const contractAddress = "0xf9dE025Ba389114442d949c60De81C3120eE51FE";
export const newTokenUri = "https://cdn.chainlabs.in/metadata.json";

const alchemy_api_key = `${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
export const base_rpc = `https://base-mainnet.g.alchemy.com/v2/${alchemy_api_key}`;
