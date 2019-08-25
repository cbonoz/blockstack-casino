import * as blockstack from "blockstack"

import { SYMBOLS_RANDOM } from "../../constants/symbols.constants"
import { SlotMachine } from "../slot-machine/slot-machine.component"

import "./app.style.scss"

const PUT_OPTIONS = {
  encrypt: true
}
const GET_OPTIONS = {
  decrypt: true
}
const STATE_FILE = "status.json"

const appConfig = new blockstack.AppConfig(["store_write", "publish_data"])
const userSession = new blockstack.UserSession({ appConfig })


export class App {
  // CSS selectors:
  static S_COINS = "#coins"
  static S_JACKPOT = "#jackpot"
  static S_SPINS = "#spins"
  static S_MAIN = "#main"
  static S_LOGIN = "#login"
  static S_HEADING = "#heading-name"
  static S_AVATAR = "#avatar-image"
  static BASE_URL = "localhost:8080"

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

  // TODO: Pull these from blockstack gaia storage.
  lastSpin = localStorage.lastSpin || 0
  loaded = false

  // Main app.
  constructor() {
    const self = this

    function showProfile() {
      const profile = userSession.loadUserData()
      self.login.innerHTML = "Logout"
      self.login.addEventListener("click", () => {
        userSession.signUserOut(window.location.origin)
      })
      const person = new blockstack.Person(profile)
      console.log("profile", profile)
      self.heading.innerHTML = person.name() || profile.username
      self.avatar.setAttribute("src", person.avatarUrl())
      const now = Date.now()
      if (now - self.lastSpin >= App.ONE_DAY) {
        self.jackpot =
          Math.max(500, self.jackpot - 500 + Math.random() * 1000) | 0
        localStorage.lastSpin = now
      }
      self.saveState()
      // document.getElementById('section-1').style.display = 'none'
      // document.getElemntById('section-2').style.display = 'block'
    }

    if (userSession.isUserSignedIn()) {
      showProfile()
    } else if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then(() => {
        showProfile()
      })
    } else {
      this.login.innerHTML = "Login with Blockstack"
      this.login.addEventListener("click", () => {
        userSession.redirectToSignIn()
      })
    }

    // eslint-disable-next-line no-new
    const slotMachine = new SlotMachine(
      this.mainElement,
      this.handleUseCoin.bind(this),
      this.handleGetPrice.bind(this),
      5,
      SYMBOLS_RANDOM
    )

    const originalSpeed = slotMachine.speed

    let confirmation
    let yes
    let no

    const wait = () => {
      console.log("Ok... 👌")

      setTimeout(() => {
        console.log(confirmation)
      }, 5000)
    }

    const cheat = () => {
      slotMachine.speed = originalSpeed / 100
      confirmation =
        "Ok, really... Last chance. Do yo want to go back to normal mode? 😠"
      yes = normal // eslint-disable-line no-use-before-define
      no = wait

      console.log("Ok, but we are calling the cops... 🚔")
      console.log("Do you want to stop this before it's too late?")
    }

    const normal = () => {
      slotMachine.speed = originalSpeed
      confirmation =
        "I'm sure you are gonna like it...? Wanna play in God mode? 😏 💰"
      yes = cheat
      no = wait

      console.log("Playing in normal mode.")
      console.log("Wanna switch to God mode? 😏")
    }

    normal()

    const yesGetter = () => {
      yes()
    }
    const noGetter = () => {
      no()
    }

    Object.defineProperties(window, {
      yes: { get: yesGetter },
      no: { get: noGetter },
      Yes: { get: yesGetter },
      No: { get: noGetter }
    })
  }

  handleUseCoin() {
    if (!userSession.isUserSignedIn()) {
      alert("Login with Blockstack to Play!")
      return false // not able to spin
    }

    if (this.coins === 1) {
      alert(
        "This would in theory be your last coin, but don't worry though - we'll give you more to continue :)"
      )
    }

    this.coins = Math.max(this.coins - 1, 0) || 100
    ++this.jackpot
    ++this.spins
    this.lastSpin = Date.now()

    this.saveState()
    return true
  }

  handleGetPrice(fixedPrize, jackpotPercentage) {
    const price = fixedPrize + Math.round(jackpotPercentage * this.jackpot)

    this.jackpot = Math.max(this.jackpot - price, 0) || 1000
    this.coins += price

    this.saveState()
  }

  saveState() {
    const self = this
    const state = {
      coins: self.coins,
      jackpot: self.jackpot,
      spins: self.spins
    }

    if (!this.loaded) {
      self.getState()
      this.loaded = true
      return
    }

    if (userSession.isUserSignedIn()) {
      userSession
        .putFile(STATE_FILE, JSON.stringify(state), PUT_OPTIONS)
        .then(() => {
          self.getState()
        })
    } else {
      alert("Unable to load data, user session expired. Please login again.")
    }
  }

  refreshView() {
    const self = this
    self.coinsElement.innerText = self.coins
    self.jackpotElement.innerText = self.jackpot
    self.spinsElement.innerText = self.spins
  }

  getState() {
    const self = this
    userSession.getFile(STATE_FILE, GET_OPTIONS).then(file => {
      const status = JSON.parse(file || "{}")
      self.coins = status.coins || 100
      self.jackpot = status.jackpot || 1000
      self.spins = status.spins || 0
      self.refreshView()
    })
  }
}
