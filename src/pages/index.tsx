import React, { useEffect, useState } from "react";
import abi from "@/abi.json";
import { ethers, Wallet } from "ethers";
import {
  base_rpc,
  contractAddress,
  newTokenUri,
  sender_private_key,
} from "@/constant";
import Image from "next/image";

const GIFT_STATUS = {
  CHECKING: "checking",
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  FUNDING: "funding",
};

const Page = () => {
  const [wallet, setWallet] = useState<Wallet>();
  const [mintStatus, setMintStatus] = useState(GIFT_STATUS.CHECKING);
  const [userToken, setUserToken] = useState<string | null>(null);

  const checkMintStatus = async (userWallet: Wallet) => {
    const provider = ethers.getDefaultProvider(base_rpc);
    // const mainWallet = new ethers.Wallet(`${sender_private_key}`, provider);
    const contract = new ethers.Contract(contractAddress, abi, provider);
    const hasMinted = await contract.balanceOf(userWallet?.address);
    if (hasMinted > 0) {
      // const userWalletWithProvider = wallet?.connect(provider);
      const contract = new ethers.Contract(
        contractAddress,
        abi,
        provider
        // userWalletWithProvider
      );
      const filter = contract.filters.Transfer(null, userWallet?.address);
      const events = await contract.queryFilter(filter);
      const userToken = events?.[0]?.args?.[2].toString();
      setUserToken(userToken);
      setMintStatus(GIFT_STATUS.COMPLETED);
    } else {
      setMintStatus(GIFT_STATUS.NOT_STARTED);
    }
  };

  useEffect(() => {
    const storedPrivateKey = localStorage.getItem("gift_wallet_private_key");
    if (storedPrivateKey) {
      const savedWallet = new ethers.Wallet(storedPrivateKey);
      setWallet(savedWallet);
      checkMintStatus(savedWallet);
    } else {
      const newWallet = ethers.Wallet.createRandom();
      localStorage.setItem("gift_wallet_private_key", newWallet.privateKey);
      setWallet(newWallet);
    }
  }, []);

  const fundWalletAndMintNFT = async () => {
    setMintStatus(GIFT_STATUS.FUNDING);
    const provider = ethers.getDefaultProvider(base_rpc);
    const mainWallet = new ethers.Wallet(`${sender_private_key}`, provider);

    try {
      const estimatedGas = ethers.BigNumber.from(160000);
      const gasPrice = ethers.utils.parseUnits("0.5", "gwei");
      const balance = await provider.getBalance(`${wallet?.address}`); // Add extra funds to accommodate change in gas fees
      const transactionCost = estimatedGas.mul(gasPrice).mul(2);
      const totalTransactionCost = transactionCost; // Add 10% to transactionCost
      const toSend = balance.lte(totalTransactionCost)
        ? totalTransactionCost.sub(balance)
        : ethers.BigNumber.from(0);
      // console.log({
      //   balance: ethers.utils.formatEther(balance),
      //   totalTransactionCost: ethers.utils.formatEther(totalTransactionCost),
      //   transactionCost: ethers.utils.formatEther(transactionCost),
      //   buffer: ethers.utils.formatEther(buffer),
      //   toSend: ethers.utils.formatEther(toSend),
      // });

      if (balance.lte(totalTransactionCost)) {
        const tx = await mainWallet.sendTransaction({
          to: wallet?.address,
          value: toSend,
        });
        await tx.wait();
        console.log("Transferred");
      }

      setMintStatus(GIFT_STATUS.IN_PROGRESS);
      mintNFTFromUserWallet();
    } catch (error) {
      console.error("Funding failed:", error);
      setMintStatus(GIFT_STATUS.NOT_STARTED);
    }
  };

  const mintNFTFromUserWallet = async () => {
    try {
      const provider = ethers.getDefaultProvider(base_rpc);
      const userWalletWithProvider = wallet?.connect(provider);
      const contract = new ethers.Contract(
        contractAddress,
        abi,
        userWalletWithProvider
      );

      const tx = await contract.mint(newTokenUri, {
        gasPrice: ethers.utils.parseUnits("0.1", "gwei"),
        value: 0,
        gasLimit: 200000,
      });
      await tx.wait();

      const filter = contract.filters.Transfer(null, wallet?.address);
      const events = await contract.queryFilter(filter);
      const userToken = events?.[0]?.args?.[2].toString();
      setUserToken(userToken);

      setMintStatus(GIFT_STATUS.COMPLETED);
    } catch (error) {
      console.error("Minting failed:", error);
      setMintStatus(GIFT_STATUS.NOT_STARTED);
    }
  };

  const handleClaimGift = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (mintStatus === GIFT_STATUS.NOT_STARTED) {
      fundWalletAndMintNFT();
    }
  };
  const Navbar = () => (
    <nav className="w-full flex items-center justify-center sm:justify-between py-4 sm:py-6 bg-primary bg-opacity-50 shadow-md fixed top-0 sm:px-20">
      <Image src="/logo.svg" alt="logo" height={60} width={150} />
    </nav>
  );

  return (
    <>
      <Navbar />
      {/* <HeroImage /> */}

      <div
        className="flex flex-col items-center justify-center min-h-screen  text-lightGray px-4 py-8 bg-primary bg-cover bg-no-repeat"
        // style={{ backgroundImage: "url(/bg.jpg)" }}
      >
        <Image
          src="/nft.jpeg"
          alt="hero"
          width={300}
          height={300}
          className="rounded-lg mb-4 sm:w-200 sm:h-200 mt-10 sm:mt-0"
        />
        <h1 className="text-2xl sm:text-6xl font-festive text-white mb-4 font-bold">
          🪔 Happy Diwali! 🪔
        </h1>
        <p className="text-sm sm:text-lg text-lightGray font-semibold mb-8 text-center">
          Welcome to your ChainLabs Diwali gift page! Claim your special NFT
          gift below.
        </p>
        {(mintStatus === GIFT_STATUS.NOT_STARTED ||
          mintStatus === GIFT_STATUS.CHECKING) && (
          <button
            onClick={handleClaimGift}
            className="cursor-pointer bg-highlight text-secondary text-base sm:text-lg font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-full shadow-lg transform transition hover:scale-105 hover:shadow-2xl disabled:bg-grey-400"
            disabled={mintStatus === GIFT_STATUS.CHECKING}
          >
            {mintStatus === GIFT_STATUS.CHECKING
              ? "Please Wait..."
              : "Claim Your Gift"}
          </button>
        )}
        {(mintStatus === GIFT_STATUS.IN_PROGRESS ||
          mintStatus === GIFT_STATUS.FUNDING) && (
          <ProgressBar state={mintStatus} />
        )}
        {mintStatus === GIFT_STATUS.COMPLETED && (
          <p className="text-sm sm:text-lg text-white mt-6 sm:mt-8 text-center font-bold">
            Your gift is claimed! 🎁{" "}
            <a
              href={`https://opensea.io/assets/base/${contractAddress}/${userToken}`}
              className="underline hover:text-highlight"
              target="_blank"
            >
              View Your Gift
            </a>
          </p>
        )}
      </div>
    </>
  );
};

// Component for showing the progress bar with messages
const ProgressBar = ({ state }: { state: string }) => {
  const [progress, setProgress] = useState(20);
  const messages = [
    "Preparing your gift...",
    "Packing your gift...",
    "Adding final touches...",
    "Almost ready...",
  ];

  useEffect(() => {
    if (state !== GIFT_STATUS.FUNDING) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 100 ? prev + 20 : 100));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state]);

  return (
    <div className="w-full max-w-md mt-8 bg-secondary p-6 rounded-xl shadow-lg transform transition hover:scale-105 hover:shadow-2xl">
      <p className="text-lightGray mb-4 text-center font-semibold">
        {messages[Math.floor(progress / 25)]}
      </p>
      <div className="w-full h-4 bg-lightGray rounded-full overflow-hidden">
        <div
          className="bg-highlight h-full transition-all duration-500 ease-in-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Page;
