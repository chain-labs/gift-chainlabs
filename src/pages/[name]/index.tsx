import React, { useEffect, useState } from "react";
import abi from "@/abi.json";
import { ethers, Wallet } from "ethers";
import { contractAddress, newTokenUri, sender_private_key } from "@/constant";
import Image from "next/image";
import { useRouter } from "next/router";

const GIFT_STATUS = {
  CHECKING: "checking",
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  FUNDING: "funding",
};

const Page = () => {
  const router = useRouter();
  const { name } = router.query;
  const [wallet, setWallet] = useState<Wallet>();
  const [mintStatus, setMintStatus] = useState(GIFT_STATUS.CHECKING);

  const checkMintStatus = async (address: string) => {
    console.log({ address });
    const mainWallet = new ethers.Wallet(
      `${sender_private_key}`,
      ethers.getDefaultProvider("https://mainnet.base.org")
    );
    const contract = new ethers.Contract(contractAddress, abi, mainWallet);
    const hasMinted = await contract.balanceOf(address);
    if (hasMinted > 0) {
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
      checkMintStatus(savedWallet.address);
    } else {
      const newWallet = ethers.Wallet.createRandom();
      localStorage.setItem("gift_wallet_private_key", newWallet.privateKey);
      setWallet(newWallet);
    }
  }, []);

  const fundWalletAndMintNFT = async () => {
    setMintStatus(GIFT_STATUS.FUNDING);
    const provider = ethers.getDefaultProvider("https://mainnet.base.org");
    const mainWallet = new ethers.Wallet(`${sender_private_key}`, provider);

    const contract = new ethers.Contract(contractAddress, abi, mainWallet);

    try {
      const estimatedGas = await contract.estimateGas.mint(newTokenUri);
      const gasPrice = await mainWallet.provider.getGasPrice();
      const balance = await provider.getBalance(`${wallet?.address}`);
      const buffer = ethers.utils.parseEther("0.001"); // Add extra funds to accommodate change in gas fees
      const transactionCost = estimatedGas.mul(gasPrice).add(buffer);
      console.log({
        balance: ethers.utils.formatEther(balance),
        transactionCost: ethers.utils.formatEther(transactionCost),
      });

      if (balance.lte(transactionCost)) {
        const tx = await mainWallet.sendTransaction({
          to: wallet?.address,
          value: transactionCost,
        });
        await tx.wait();
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
      const provider = ethers.getDefaultProvider("https://mainnet.base.org");
      const userWalletWithProvider = wallet?.connect(provider);
      const contract = new ethers.Contract(
        contractAddress,
        abi,
        userWalletWithProvider
      );

      const tx = await contract.mint(newTokenUri);
      await tx.wait();

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
    <nav className="w-full flex items-center justify-between p-4 bg-primary bg-opacity-50 shadow-md fixed top-0 px-20 sm: px-1">
      <Image src="/logo.svg" alt="logo" height={60} width={150} />
    </nav>
  );

  return (
    <>
      <Navbar />
      {/* <HeroImage /> */}

      <div
        className="flex flex-col items-center justify-center min-h-screen  text-lightGray px-4 py-8 bg-cover bg-no-repeat"
        style={{ backgroundImage: "url(/bg.jpg)" }}
      >
        <Image
          src="/nft.jpeg"
          alt="hero"
          width={300}
          height={300}
          className="rounded-lg mb-4 sm:w-200 sm:h-200 mt-10 sm:mt-0"
        />
        <h1 className="text-2xl sm:text-6xl font-festive text-white mb-4 font-bold">
          🪔 Happy Diwali, <span className="text-highlight">{name}</span> 🪔
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
            Claim Your Gift
          </button>
        )}
        {mintStatus === GIFT_STATUS.FUNDING && (
          <p className="text-sm sm:text-lg text-lightGray mt-4 sm:mt-6 text-center font-semibold">
            Funding your wallet, please wait...
          </p>
        )}
        {mintStatus === GIFT_STATUS.IN_PROGRESS && <ProgressBar />}
        {mintStatus === GIFT_STATUS.COMPLETED && (
          <p className="text-sm sm:text-lg text-white mt-6 sm:mt-8 text-center font-bold">
            Your gift is claimed! 🎁{" "}
            <a
              href={`https://opensea.io/${wallet?.address}`}
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
const ProgressBar = () => {
  const [progress, setProgress] = useState(0);
  const messages = [
    "Preparing your gift...",
    "Packing your gift...",
    "Adding final touches...",
    "Almost ready...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 25 : 100));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
