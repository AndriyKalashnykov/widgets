import DePayWidgets from '../../../src'
import fetchMock from 'fetch-mock'
import mockAmountsOut from '../../../tests/mocks/amountsOut'
import mockBasics from '../../../tests/mocks/basics'
import React from 'react'
import ReactDOM from 'react-dom'
import { CONSTANTS } from '@depay/web3-constants'
import { mock, confirm, resetMocks, anything } from '@depay/web3-mock'
import { resetCache, provider } from '@depay/web3-client'
import { routers, plugins } from '@depay/web3-payments'
import { Token } from '@depay/web3-tokens'

describe('Donation Widget: whitelist', () => {

  const blockchain = 'ethereum'
  const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045']
  beforeEach(resetMocks)
  beforeEach(resetCache)
  beforeEach(()=>fetchMock.restore())
  beforeEach(()=>mock({ blockchain, accounts: { return: accounts } }))

  let DEPAY = '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb'
  let DAI = CONSTANTS[blockchain].USD
  let ETH = CONSTANTS[blockchain].NATIVE
  let WETH = CONSTANTS[blockchain].WRAPPED
  let WRAPPED_AmountInBN
  let TOKEN_A_AmountBN
  let toAddress = '0x4e260bB2b25EC6F3A59B478fCDe5eD5B8D783B02'
  let amount = 20
  let exchange
  let defaultArguments = {
    accept: [{
      blockchain,
      token: DEPAY,
      receiver: toAddress
    }]
  }

  beforeEach(()=>{
    
    ({ WRAPPED_AmountInBN, TOKEN_A_AmountBN, exchange } = mockBasics({
      provider: provider(blockchain),
      blockchain,

      fromAddress: accounts[0],
      fromAddressAssets: [
        {
          "name": "Ether",
          "symbol": "ETH",
          "address": ETH,
          "type": "NATIVE"
        }, {
          "name": "Dai Stablecoin",
          "symbol": "DAI",
          "address": DAI,
          "type": "20"
        }, {
          "name": "DePay",
          "symbol": "DEPAY",
          "address": DEPAY,
          "type": "20"
        }
      ],
      
      toAddress,

      exchange: 'uniswap_v2',
      NATIVE_Balance: 1,

      TOKEN_A: DEPAY,
      TOKEN_A_Decimals: 18,
      TOKEN_A_Name: 'DePay',
      TOKEN_A_Symbol: 'DEPAY',
      TOKEN_A_Amount: amount,
      TOKEN_A_Balance: 30,
      
      TOKEN_B: DAI,
      TOKEN_B_Decimals: 18,
      TOKEN_B_Name: 'Dai Stablecoin',
      TOKEN_B_Symbol: 'DAI',
      TOKEN_B_Amount: 33,
      TOKEN_B_Balance: 50,

      TOKEN_A_TOKEN_B_Pair: CONSTANTS[blockchain].ZERO,
      TOKEN_B_WRAPPED_Pair: '0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11',
      TOKEN_A_WRAPPED_Pair: '0xEF8cD6Cb5c841A4f02986e8A8ab3cC545d1B8B6d',

      WRAPPED_AmountIn: 0.01,
      USD_AmountOut: 33,

      timeZone: 'Europe/Berlin',
      stubTimeZone: (timeZone)=> {
        cy.stub(Intl, 'DateTimeFormat', () => {
          return { resolvedOptions: ()=>{
            return { timeZone }
          }}
        })
      },

      currency: 'EUR',
      currencyToUSD: '0.85'
    }))

     mockAmountsOut({
      provider: provider(blockchain),
      blockchain,
      exchange,
      amountInBN: '1176470588235294200',
      path: [DAI, WETH, DEPAY],
      amountsOut: [
        '1176470588235294200',
        WRAPPED_AmountInBN,
        TOKEN_A_AmountBN
      ]
    })
  })
  
  describe('whitelist fromTokens', () => {

    it('allows to whitelist fromTokens to only route those for payments', ()=> {
      cy.visit('cypress/test.html').then((contentWindow) => {
        cy.document().then((document)=>{
          DePayWidgets.Donation({ ...defaultArguments, document,
            whitelist: {
              ethereum: [
                ETH,
                DAI
              ]
            }
          })
          cy.get('.ReactShadowDOMOutsideContainer').shadow().find('.Card[title="Change payment"]').click()
          
          cy.get('.Card[title="Select DEPAY as payment"]', { includeShadowDom: true }).should('not.exist')

          cy.get('.ReactShadowDOMOutsideContainer').shadow().find('.Card[title="Select ETH as payment"]').contains('.TokenAmountCell', '0.01').should('exist')
          cy.get('.ReactShadowDOMOutsideContainer').shadow().find('.Card[title="Select ETH as payment"]').contains('.TokenSymbolCell', 'ETH').should('exist')
          cy.get('.ReactShadowDOMOutsideContainer').shadow().find('.Card[title="Select ETH as payment"]').contains('.CardText small', '1').should('exist')

          cy.get('.ReactShadowDOMOutsideContainer').shadow().find('.Card[title="Select DAI as payment"]').find('.CardImage img').invoke('attr', 'src').should('eq', 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png')
          cy.get('.ReactShadowDOMOutsideContainer').shadow().find('.Card[title="Select DAI as payment"]').contains('.TokenAmountCell', '33').should('exist')
          cy.get('.ReactShadowDOMOutsideContainer').shadow().find('.Card[title="Select DAI as payment"]').contains('.TokenSymbolCell', 'DAI').should('exist')
          cy.get('.ReactShadowDOMOutsideContainer').shadow().find('.Card[title="Select DAI as payment"]').contains('.CardText small', '50').should('exist')
        })
      })
    })
  })
})
