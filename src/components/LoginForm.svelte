<script>
  let login = "User";
  let password = "Password";
  let save = false;
  let sex = "sex";

  const userData = { login, password, save, sex };

  function loginHandler() {
    console.log(userData);
  }
</script>

<h1>Login form</h1>
<form on:submit|preventDefault={loginHandler}>
  <input placeholder="login" type="text" bind:value={login} />
  <input placeholder="password" type="password" bind:value={password} />
  <input type="checkbox" bind:checked={save} />
  Save: {save}
  <select bind:value={sex}>
    <option value="male">👦</option>
    <option value="female">👧</option>
  </select>
  <button type="submit">go!</button>
</form>
