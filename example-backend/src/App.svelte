<script>
	import { onMount } from "svelte";
	const apiURL = "http://localhost:5000/student";
    let data = [];
	onMount(async function() {
        const response = await fetch(apiURL);
        data = await response.json();
	});
	import Modal from './Modal.svelte';

	let showModal = false;
</script>
<style>
	button {
		height: 30vh;
		width: 40vw;
		margin: 2vh;
		font-size: 5vh;
	}
	.content {
		margin-top: 5vh;
	}
	.options {
		text-align: center;
	}
</style>

<section class="hero is-link is-bold">
	<div class="hero-body">
	  <div class="container">
		<h1 class="title">
		  Reading List Recommendations
		</h1>
		<h2 class="subtitle">
		  Get customised book recommendations
		</h2>
	  </div>
	</div>
  </section>


<div class="content">
	<div class="options">
		<button on:click="{() => showModal = true}"class="button is-hovered is-link is-light">Book Recommendations</button>
	</div>
	{#each data as item }
		<div>
			<p> {item.name} </p>
			<p> {item.college_id} </p>
		</div>
	{/each}
	
	<div class="options">
		<button class="button is-hovered is-link is-light">Get Information</button>
	</div>
  </div>

{#if showModal}
	<Modal on:close="{() => showModal = false}">
		<h2 slot="header">
			<strong>Get your reading list recommendation</strong> 
		</h2>

        
        <div class="content">
           <form action="">
            <div class="field">
                <label class="label">Tags</label>
                <div class="control">
                  <input class="input" type="text" placeholder="Enter tag names for your search">
                </div>
              </div>
              
              <div class="field">
                <label class="label">Author Name</label>
                <div class="control">
                  <input class="input" type="text" placeholder="Enter name of author">
                </div>
              </div>
              
              
              <div class="field">
                <label class="label">Rating</label>
                <div class="control">
                  <div class="select">
                    <select>
                      <option>Any</option>
                      <option>>4</option>
                      <option>>3</option>
                      <option>>2</option>
                      <option>>1</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="field">
                <label class="label">Language</label>
                <div class="control">
                  <div class="select is-multiple">
                    <select>
                      <option>Any</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="field">
                <label class="label">Publication Year</label>
                <div class="control">
                  <div class="select is-multiple">
                    <select>
                      <option>Any</option>
                    </select>
                  </div>
                </div>
              </div>
              <br>
              
              <div class="field is-grouped">
                <div class="control">
                  <button class="button is-link">Submit</button>
                </div>
                <div class="control">
                  <button class="button is-link is-light">Cancel</button>
                </div>
              </div>
           </form>
          </div>

		<a href="https://www.merriam-webster.com/dictionary/modal">merriam-webster.com</a>
	</Modal>
{/if}


