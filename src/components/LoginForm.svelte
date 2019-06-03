<script>
  let login = "User";
  let password = "Password";
  let save = false;
  let sex = "female";
  
  let questions = [
    { id: 1, text: `Where did you go to school?` },
    { id: 2, text: `What is your mother's name?` },
    {
      id: 3,
      text: `What is another personal fact that an attacker could easily find with Google?`
    }
  ];

  let selected;
  // let answer = "";
  const userData = { login, password, save, sex };
</script>

<h1>Login form</h1>
<form on:submit|preventDefault={loginHandler}>
  <input placeholder="login" type="text" bind:value={login} />
  <input placeholder="password" type="password" bind:value={password} />
  <input type="checkbox" bind:checked={save} />
  Save: {save}
  <select bind:value={selected}>
    {#each questions as question}
      <option value={question}> {question.text} </option>
    {/each}
  </select>
  <button type="submit">go!</button>
</form>
