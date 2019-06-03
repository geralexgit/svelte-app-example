<script>
  import isEmail from "validator/lib/isEmail";

  let login = "User";
  let password = "Password";
  let email = "";
  let save = false;
  let sex = "female";
  let selected = {};
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

  function loginHandler() {
    touched = true;
    let userData = { login, password, save, selected: selected.id, sex };
    console.log(userData, touched, isValidEmail);
  }
</script>

<h1>Login form</h1>
<form on:submit|preventDefault={loginHandler}>
  <input placeholder="login" type="text" bind:value={login} />
  <input placeholder="password" type="password" bind:value={password} />

  <input placeholder="email" type="email" bind:value={email} />
  {#if !isValidEmail && touched}
    <p>Email is invalid</p>
  {/if}
  <label for="save">
    <input id="save" type="checkbox" bind:checked={save} />
    Save: {save}
  </label>
  <select bind:value={selected} on:change={() => console.log(selected)}>
    {#each questions as question}
      <option value={question}> {question.text} </option>
    {/each}
  </select>
  <button type="submit">go!</button>
</form>
