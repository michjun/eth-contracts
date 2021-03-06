import { BitGo } from 'bitgo';
import * as ethUtil from 'ethereumjs-util';
import { Contract } from '../../src/contract';


async function sendBitGoTx(): Promise<void> {

    const bitGo = new BitGo({ env: 'prod' });
    const baseCoin = bitGo.coin('eth');
    bitGo.authenticateWithAccessToken({ accessToken: 'access token' });
    const bitGoWallet = await baseCoin.wallets().get({ id: 'wallet id' });
    const walletPassphrase = 'password';

    const proxyAddress = '0xB575c158399227b6ef4Dcfb05AA3bCa30E12a7ba';
    const Allocator = new Contract('SkaleAllocator').address(proxyAddress);

    /**
     * Get the Escrow wallet address that is linked to the delegator's Bitgo wallet address
     */
    let { data, amount, address } = Allocator.methods().getEscrowAddress.call({
        beneficiary: bitGoWallet.getAddress()
    });
    let escrowAddress = await bitGoWallet.send({ data, amount, address, walletPassphrase });

    //Retrieve Escrow contract for delegator
    const Escrow = new Contract('SkaleEscrow').address(escrowAddress);

    //parameters needed for withdrawing bounties
    const idOfValidator = "validator id";
    
    /**
     * Withdraw bounty for delegator's Escrow account.
     *
     * Allows token holder (delegator) to withdraw bounty from a specific validator.
     * This needs to be called per validator in order to recieve all of the bounties.
     */
    ({ data, amount, address } = Escrow.methods().withdrawBounty.call({
        validatorId: idOfValidator, 
        address: bitGoWallet.getAddress()
    }));
    let transaction = await bitGoWallet.send({ data, amount, address, walletPassphrase });
    console.dir(transaction);

}

sendBitGoTx();
