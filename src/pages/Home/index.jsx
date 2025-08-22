import preactLogo from '../../assets/preact.svg';
import './style.css';
import { useState, useEffect } from 'preact/hooks';
import { Modal } from "../../components/Modal.jsx";
import { ed25519 } from '@noble/curves/ed25519';

const getSubset = async (searchText) => {
  const tally_url = `https://tally.securepollingsystem.com/opinions?subset=${searchText}`;
  const res = await fetch(
    tally_url
  ).catch((e) => {
    console.log(e);
  });
  console.log(
    "url:",
    tally_url
  );

  var data = [];

  try {
    if (!res.ok) {
      throw new Error(`Network response was not ok. Status: ${res.status}`);
    }
    data = await res.json();
  } catch(error) {
    console.log('could not try if !res.ok', error);
    if (searchText == '') {
      data = [ {id:0,opinion:'no data was returned from the server',screed_count:53} ];
    }
  }

  console.log("fetched opinions:", data.length);

  return data;
};

// Helper functions to convert between hex, base64, and Uint8Array
const hexToBytes = (hex) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
};

const bytesToHex = (bytes) => {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

const bytesToBase64 = (bytes) => {
  return btoa(String.fromCharCode(...bytes));
};

export function Home() {
  const [showModal, setShowModal] = useState(false);
  const [searchString, setSearchString] = useState(""); // returns the value and a function to update the value (initially "")
  const [subset, setSubset] = useState([]);
  const [modalData, setModalData] = useState({title : "title", children : "slkdfjslkdfjsldkfj"});
  const [loadedScreed, setLoadedScreed] = useState(['default val']);
  const [privateKey, setPrivateKey] = useState(['default val']);

  function changeScreed(newScreed) {
    setLoadedScreed(newScreed); // scheduled for next render
    localStorage.setItem("myScreed", JSON.stringify(newScreed)); // update local storage
  }

  function addThisOpinion(opinion) { // TODO: figure out why this doesnt actually save the most recent thing
    changeScreed([...loadedScreed, opinion]);
    setShowModal(false);
  }

  function clearMyScreedModal() {
    var Buttons = () => (<div>
      <button id="confirmBtn" onClick={() => {
        changeScreed([]);
        setShowModal(false);
      } }>yes Clear My Screed</button>
      <button onClick={() => setShowModal(false)}>Cancel</button></div>);

    setModalData({title : "You are about to clear out your whole screed!",
    children : <div><br/><Buttons /></div>});
    setShowModal(true);
  }

  function deleteThisOpinionModal(opinion) {
    var Buttons = () => (<div>
      <button id="confirmBtn" onClick={() => {
        changeScreed(loadedScreed.filter(item => item !== opinion)); // remove this opinion
        setShowModal(false);
      } }>remove from my screed</button>
      <button onClick={() => setShowModal(false)}>Cancel</button></div>);

    setModalData({title : "Do you want to REMOVE this opinion from your screed?",
    children : <div><div>{opinion}</div><br/><Buttons /></div>});
    setShowModal(true);
  }

  function bringUpAddThisModal(opinion) {
    if (loadedScreed.indexOf(opinion) >= 0) {
      var Buttons = () => (<div>
        <button id="confirmBtn" onClick={() => setShowModal(false)}>Oops sorry</button></div>);

      setModalData({
        title : "You already have this opinion in your screed!",
        children : <div><div>{opinion}</div><br/><Buttons /></div>
      });
    } else {
      var Buttons = () => (<div>
        <button id="confirmBtn" onClick={() => addThisOpinion(opinion)}>Confirm</button>
        <button onClick={() => setShowModal(false)}>Cancel</button></div>);

      setModalData({title : "Do you want to add this opinion to your screed?",

      children : <div><div>{opinion}</div><br/><Buttons /></div>});
    }
    setShowModal(true);
  }

  useEffect(() =>
    {
      console.log("myPrivateKeyHex:",localStorage.getItem("myPrivateKeyHex"));
      setPrivateKey(localStorage.getItem("myPrivateKeyHex") || ["nothing found in local storage"]);
    },
    []
  );

  function genKey() {
    // Generate a new Ed25519 private key using noble-curves
    const privateKeyBytes = ed25519.utils.randomSecretKey();
    const publicKeyBytes = ed25519.getPublicKey(privateKeyBytes);

    console.log("Signing public key:", bytesToHex(publicKeyBytes));
    const privateKeyHex = bytesToHex(privateKeyBytes);
    console.log("Signing private key:", privateKeyHex);

    setPrivateKey(privateKeyHex); // sets the private key hex string in the state
    localStorage.setItem("myPrivateKeyHex", privateKeyHex); // saves the private key
    console.log("privateKey saved to localStorage:", privateKeyHex);
  }

  function clearKey() {
    setPrivateKey("nothing found in local storage"); // sets the private key hex string in the state
    localStorage.setItem("myPrivateKeyHex", ["nothing found in local storage"]); // saves the private key
    console.log("privateKey cleared");
  }

  useEffect(() =>
    {
      console.log("myScreed:",localStorage.getItem("myScreed"));
      setLoadedScreed(JSON.parse(localStorage.getItem("myScreed")) || []);
    },
    []
  );

  useEffect(() => {
    getSubset(searchString.toLowerCase()).then(setSubset);
  }, [searchString]); // searchString is what it watches and reloads the fetch on changes!!!!!!!

  useEffect(() => {
    if (showModal) {
      document.getElementById("confirmBtn").focus(); // make Enter not go to the wrong place
    }
    function handleKeyDown(e) {
      if (e.key === "Escape" && showModal) { // close the modal if escape is pressed
        setShowModal(false);
      }
      if (e.key === "Escape" && showModal == false) { // clear searchString if escape pressed
        setSearchString("");
      }
      if (e.key === "Enter" && showModal) { // activate the button that is offered in the modal
        const btn = document.getElementById("confirmBtn");
        if (btn) btn.click();
        setShowModal(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  function getSignedScreedObject() {
    if (!privateKey || privateKey == "nothing found in local storage") {
      alert('You can\'t upload your screed without an encryption key!');
      return null;
    }

    try {
      const privateKeyBytes = hexToBytes(privateKey);
      const publicKeyBytes = ed25519.getPublicKey(privateKeyBytes);
      const publicKeyHex = bytesToHex(publicKeyBytes);

      const screedString = JSON.stringify(loadedScreed);
      const messageBytes = new TextEncoder().encode(screedString);

      // Sign the message using Ed25519
      const signatureBytes = ed25519.sign(messageBytes, privateKeyBytes);
      const signature = bytesToBase64(signatureBytes);
      
      return { // Create the signed screed object
        screed: screedString,
        signature,
        publicKey: publicKeyHex
      };
    } catch (error) {
      alert('Error creating signed screed: ' + error.message);
      return null;
    }
  }

  function uploadScreed() {
    const signedObj = getSignedScreedObject();
    if (!signedObj) return;
    fetch("https://tally.securepollingsystem.com/upload-screed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(signedObj)
    })
      .then(res => res.json())
      .then(data => {
        alert("Screed uploaded! Server response: " + JSON.stringify(data));
      })
      .catch(err => {
        alert("Failed to upload screed: " + err);
      });
  }

  // Helper function to get public key for display
  function getPublicKeyDisplay() {
    if (!privateKey || privateKey == "nothing found in local storage") {
      return "";
    }
    try {
      const privateKeyBytes = hexToBytes(privateKey);
      const publicKeyBytes = ed25519.getPublicKey(privateKeyBytes);
      const publicKeyHex = bytesToHex(publicKeyBytes);
      // Split into two parts like the original code
      const part1 = publicKeyHex.slice(0, 32);
      const part2 = publicKeyHex.slice(32, 64);
      return `${part1} ${part2}`;
    } catch (error) {
      return "Error displaying public key";
    }
  }

  return (
    <div class="home">
      <h1>Secure Polling Demo</h1>
      <br/>
      <div style={{
        display: "flex"
          }}>
        <h1>Your Screed:</h1>
        <button onClick={clearMyScreedModal}>Clear my screed!</button>
        <button onClick={uploadScreed}>Upload my screed</button>
        <button onClick={clearKey}>Clear my privateKey!</button>
      </div>
      {privateKey == 'nothing found in local storage' ? (
        <div onClick={() => console.log("privateKey:",privateKey)} class="italic-info">
          You don't have an encryption key yet!
          <button onClick={() => genKey()} >Generate and save a new encryption key</button>
        </div>
      ) : (
        <div onClick={() => console.log("privateKey:",privateKey)} class="italic-info">
          Your public key is {getPublicKeyDisplay()}
        </div>
        )}
      {loadedScreed.map((item) => (
        <div
          onClick={() => deleteThisOpinionModal(item)}
          key={JSON.stringify(item)}
          class="opinion"
        >
          {" "}
          <div>{item}</div>
          <div style={{ fontWeight: "bold", minWidth: "3em" }}> {item.screed_count} </div>
        </div>
      ))}
      <div>
        {showModal &&
            <Modal onClose={() => setShowModal(false)} title={modalData.title}>
                {modalData.children}
            </Modal>
        }
      </div>
    <div style={{
        display: "flex"
          }}>
    <h1>Search text:</h1>
      <input
        value={searchString}
        onChange={e => setSearchString(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (searchString.trim() !== "" && subset.length === 0) {
              bringUpAddThisModal(searchString);
            }
          }
        }}
      />
    </div>
      {subset.length === 0 ? (
        <div
          onClick={() => bringUpAddThisModal(searchString)}
          key="compose"
          class="opinion"
        >
          click or press Enter to add {searchString} to your screed
        </div>
      ) : (
        subset.map((item) => (
          <div
            onClick={() => bringUpAddThisModal(item.opinion)}
            key={item.id} // react uses the key to keep track of DOM so must be unique
            class="opinion"
          >
            {" "}
            {/* https://css-tricks.com/snippets/css/a-guide-to-flexbox/ */}
            <div>{item.opinion}</div>
            <div style={{ fontWeight: "bold", minWidth: "3em" }}>
              {item.screed_count}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function Resource(props) {
  return (
    <a href={props.href} target="_blank" class="resource"> // target=_blank makes it open a new tab
      <h2>{props.title}</h2>
      <p>{props.description}</p>
    </a>
  );
}
