import * as blockstack from 'blockstack';

import { SYMBOLS_RANDOM } from '../../constants/symbols.constants';
import { SlotMachine } from '../slot-machine/slot-machine.component';

import './app.style.scss';

export class App {

    // CSS selectors:
    static S_COINS = '#coins'
    static S_JACKPOT = '#jackpot'
    static S_SPINS = '#spins'
    static S_MAIN = '#main'
    static S_LOGIN = '#login'
    static S_HEADING = '#heading-name'
    static S_AVATAR = '#avatar-image'

    // Misc.:
    static ONE_DAY = 1000 * 60 * 60 * 24

    // Elements:
    coinsElement = document.querySelector(App.S_COINS)
    jackpotElement = document.querySelector(App.S_JACKPOT)
    spinsElement = document.querySelector(App.S_SPINS)
    mainElement = document.querySelector(App.S_MAIN)
    login = document.querySelector(App.S_LOGIN)
    heading = document.querySelector(App.S_HEADING)
    avatar = document.querySelector(App.S_AVATAR)

    currentUser = null

    // TODO: Pull these from blockstack gaia storage.
    coins = parseInt(localStorage.coins, 10) || 100
    jackpot = parseInt(localStorage.jackpot, 10) || 1000
    spins = parseInt(localStorage.spins, 10) || 0
    lastSpin = localStorage.lastSpin || 0

    // Main app.
    constructor() {
        const now = Date.now();
        const self = this;

        function showProfile(userSession) {
            const profile = userSession.profile;
            self.login.innerHTML = 'Logout';
            self.login.addEventListener('click', () => {
                blockstack.signUserOut(window.location.origin);
            });
            self.currentUser = userSession;
            const person = new blockstack.Person(profile);
            console.log('profile', profile);
            self.heading.innerHTML = person.name() || userSession.username
            || self.avatar.setAttribute('src', person.avatarUrl());
            // document.getElementById('section-1').style.display = 'none'
            // document.getElemntById('section-2').style.display = 'block'
        }

        if (blockstack.isUserSignedIn()) {
            const userSession = blockstack.loadUserData();
            showProfile(userSession);
        } else if (blockstack.isSignInPending()) {
            blockstack.handlePendingSignIn().then((userSession) => {
                showProfile(userSession);
            });
        } else {
            this.login.innerHTML = 'Login with Blockstack';
            this.login.addEventListener('click', () => {
                blockstack.redirectToSignIn();
            });
        }

        if (now - this.lastSpin >= App.ONE_DAY) {
            localStorage.jackpot = this.jackpot = Math.max(500, this.jackpot - 500 + Math.random() * 1000) | 0;
            localStorage.lastSpin = now;
        }

        // eslint-disable-next-line no-new
        const slotMachine = new SlotMachine(
            this.mainElement,
            this.handleUseCoin.bind(this),
            this.handleGetPrice.bind(this),
            5,
            SYMBOLS_RANDOM,
        );

        const originalSpeed = slotMachine.speed;

        let confirmation;
        let yes;
        let no;

        const wait = () => {
            console.log('Ok... 👌');

            setTimeout(() => {
                console.log(confirmation);
            }, 5000);
        };

        const cheat = () => {
            slotMachine.speed = originalSpeed / 100;
            confirmation = 'Ok, really... Last chance. Do yo want to go back to normal mode? 😠';
            yes = normal; // eslint-disable-line no-use-before-define
            no = wait;

            console.log('Ok, but we are calling the cops... 🚔');
            console.log('Do you want to stop this before it\'s too late?');
        };

        const normal = () => {
            slotMachine.speed = originalSpeed;
            confirmation = 'I\'m sure you are gonna like it...? Wanna play in God mode? 😏 💰';
            yes = cheat;
            no = wait;

            console.log('Playing in normal mode.');
            console.log('Wanna switch to God mode? 😏');
        };

        normal();

        const yesGetter = () => { yes(); };
        const noGetter = () => { no(); };

        Object.defineProperties(window, {
            yes: { get: yesGetter },
            no: { get: noGetter },
            Yes: { get: yesGetter },
            No: { get: noGetter },
        });

        this.refreshView();
    }

    handleUseCoin() {
        if (!this.currentUser) {
            alert('Login with Blockstack to Play!');
            return false; // not able to spin
        }
        localStorage.coins = this.coins = Math.max(this.coins - 1, 0) || 100;
        localStorage.jackpot = ++this.jackpot;
        localStorage.spins = ++this.spins;
        localStorage.lastSpin = this.lastSpin = Date.now();

        this.refreshView();
        return true;
    }

    handleGetPrice(fixedPrize, jackpotPercentage) {
        const price = fixedPrize + Math.round(jackpotPercentage * this.jackpot);

        localStorage.jackpot = this.jackpot = Math.max(this.jackpot - price, 0) || 1000;
        localStorage.coins = this.coins += price;

        this.refreshView();
    }

    refreshView() {
        this.coinsElement.innerText = this.coins;
        this.jackpotElement.innerText = this.jackpot;
        this.spinsElement.innerText = this.spins;
    }

}
