const { postToFacebook } = require('./src/lib/facebook');

async function test() {
  console.log("Testing postToFacebook from lib...");
  const result = await postToFacebook({
    title: "Test from Lib",
    ingress: "Testing our new logging in production environment simulation.",
    link: "https://enzy.jenka.se/articles/test-123"
  });
  
  if (result) {
    console.log("SUCCESS! Post ID:", result);
  } else {
    console.log("FAILED! Check data/facebook_errors.log for details.");
  }
}

test();
