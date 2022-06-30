
# Changes between USDT and version we have 
[x] BasicToken
[x] BlackList
[x] Migrations
[x] MultiSigWallet
[x] Ownable
[x] Pausable
[x] SafeMath
[x] StandardToken
[x] StandardTokenWithFees
[x] TetherToken


> ### BasicToken
>> - Derives from a simplified version of the `ERC20` called `ERC20Basic` </br> 
>> - Uses **SafeMath** to subtract and add balance to different mapped addresses to the contract, which should own the token. </br> 
>> - Simply can store value/balance for different accounts, transfer from one to another and check balance. </br> 

> ### Migrations
>> - Unutilized</br> 

> ### MultiSigWallet
>> - Unutilized</br> 

> ### BasicToken
>> - Derives from a simplified version of the `ERC20` called `ERC20Basic` </br> 
>> - Uses **SafeMath** to subtract and add balance to different mapped addresses to the contract, which should own the token. </br> 
>> - Simply can store value/balance for different accounts, transfer from one to another and check balance. </br> 

> ### BlackList
>> - Gives functionality to blacklist an address (USDT). Used mainly as modifier check to prevent interactions with a blacklisted address, as well as it is a required status to delete *Black Funds*</br> 

> ### Ownable
>> **Ownable** is not deriving from **Context** (USDT)</br>
>> `renounceOwnership` missing (USDT) </br>

> ### Pausable
>> - **Pausable** is not deriving from **Context** but **Ownable** (USDT)</br> 
>> - `Pause/Paused` and `Unpause/Unpaused` events don't have an address as an argument. Both events are called as functions instead of emitting them.(USDT)</br>
>> - `paused` public, instead of a function to return the value (USDT)</br>
>> - `whenPaused` and `whenNotPaused` does not throw message errors (USDT)</br>

> ### SafeMath
>> - All default' logic is set as `unchecked` by default (USDT). Equivalent to try methods. All default methods are based on the new overflow checks in 0.8 (new)</br> 
>> - All methods' logic is set as `unchecked` by default (USDT)</br> 
>> - `try...` methods does not exist.(USDT)</br>
>> - `paused` public, instead of a function to return the value (USDT)</br>
>> - </br>

> ### StandardToken
>> - Derives from **ERC20** and **BasicToken** (USDT) (I have no clue why) </br> 
>> - All methods are equivalent with **TRC20**, except `decreaseApproval`, which cannot set the allowance to 0 by subtracting higher amount than allowed currently (new)

> ### StandardTokenWithFees
>> - Derives from **StandardToken** and equivalent to it, execept fees can be set and taken from each transfer

> ### TetherToken
>> - Derives from **Pausable**, **StandardTokenWithFees**, and **BlackList**
>> - Can be set as `deprecated` to use the functionatlity of **StandardTokenWithFees**. 
>> - Equivalent to **StandardTokenWithFees**, but it can issue(create) and redeem(delete) token count.



Notes: 
- TRC20 - line 179 should be before 176 