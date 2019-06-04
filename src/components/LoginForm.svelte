<script>
  import { connect } from "../store.js";
  import isEmail from "validator/lib/isEmail";

  let login = "User";
  let password = "Password";
  let email = "";
  let agree = false;
  let selected = {};
  let answer = "";
  let touched = false;

  $: isValidEmail = isEmail(email);

  let questions = [
    { id: 1, text: `Where did you go to school?` },
    { id: 2, text: `What is your mother's name?` },
    {
      id: 3,
      text: `What is another personal fact that an attacker could easily find with Google?`
    }
  ];

  // const [dispatch, count] = connect("count");
  const [dispatch, currentUser] = connect("currentUser");

  function loginHandler() {
    touched = true;
    let userData = { login, password, agree, selected: selected.id };
    dispatch("user/auth", userData);
  }
</script>

<style>
  .inputError {
    color: red;
    font-size: 12px;
  }
  .formWrapper {
    display: flex;
    flex-direction: column;
    max-width: 480px;
    margin: 0 auto;
  }
</style>

<form on:submit|preventDefault={loginHandler}>
  <div class="formWrapper">
    <h1>Sign Up form</h1>
    <input placeholder="login" type="text" bind:value={login} />
    <input placeholder="password" type="password" bind:value={password} />
    <input placeholder="email" type="email" bind:value={email} />
    {#if !isValidEmail && touched}
      <span class="inputError">Email is invalid</span>
    {/if}
    <label for="agree">
      <input id="agree" type="checkbox" bind:checked={agree} />
      Agree with terms and conditions
    </label>
    <select bind:value={selected}>
      {#each questions as question}
        <option value={question}> {question.text} </option>
      {/each}
    </select>
    <input placeholder="Your answer" type="text" bind:value={answer} />
    <button type="submit">go!</button>
  </div>
</form>
{#if $currentUser}
  <h1>Current user {$currentUser.login}</h1>
{/if}
