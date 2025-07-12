import preactLogo from '../../assets/preact.svg';
import './style.css';
import { useState, useEffect } from 'preact/hooks';
import { Modal } from "../../components/Modal.jsx";
import _sodium from 'libsodium-wrappers';

const getSubset = async (searchText) => {
  const res = await fetch(
    `http://stemgrid.org:8993/opinions?subset=%${searchText}%`
  ).catch((e) => {
    console.log(e);
  });
  console.log(
    "url:",
    `http://stemgrid.org:8993/opinions?subset=%${searchText}%`
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

export function Home() {
  const [sodium, setSodium] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchString, setSearchString] = useState(""); // returns the value and a function to update the value (initially "")
  const [subset, setSubset] = useState([]);
  const [modalData, setModalData] = useState({title : "title", children : "slkdfjslkdfjsldkfj"});
  const [loadedScreed, setLoadedScreed] = useState(['default val']);
  const [privateKey, setPrivateKey] = useState(['default val']);

  useEffect(() => {
    (async () => {
      await _sodium.ready;
      setSodium(_sodium);
      console.log("sodium:", _sodium);
    })();
  }, []);

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
    children : <div><Buttons /></div>});
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
    children : <div><div>{opinion}</div><Buttons /></div>});
    setShowModal(true);
  }

  function bringUpAddThisModal(opinion) {
    if (loadedScreed.indexOf(opinion) >= 0) {
      var Buttons = () => (<div>
        <button id="confirmBtn" onClick={() => setShowModal(false)}>Oops sorry</button></div>);

      setModalData({
        title : "You already have this opinion in your screed!",
        children : <div><div>{opinion}</div><Buttons /></div>
      });
    } else {
      var Buttons = () => (<div>
        <button id="confirmBtn" onClick={() => addThisOpinion(opinion)}>Confirm</button>
        <button onClick={() => setShowModal(false)}>Cancel</button></div>);

      setModalData({title : "Do you want to add this opinion to your screed?",

      children : <div><div>{opinion}</div><Buttons /></div>});
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
    const signKey = sodium.crypto_sign_keypair().privateKey; // generates a new private key for signing
    console.log("Signing public key:", sodium.to_hex(signKey.slice(32, 64)));
    const privateKey = sodium.to_hex(signKey);
    console.log("Signing private key:", privateKey);

    setPrivateKey(privateKey); // sets the private key hex string in the state
    localStorage.setItem("myPrivateKeyHex", privateKey); // saves the private key
    console.log("privateKey saved to localStorage:", privateKey);
  //  Suppose you have your private key as a hex string:
  //  const myPrivateKey = sodium.from_hex("your_private_key_hex_string");

  //  The public key is the last 32 bytes of the private key, or you can store it separately:
  //  const myPublicKey = myPrivateKey.slice(32, 64);

  //  Now you can use myPrivateKey and myPublicKey with sodium.crypto_sign functions
  //  const myPrivateKey = sodium.from_hex(myPrivateKeyHex);
  //  const myPublicKey = sodium.from_hex(myPublicKeyHex);
  }

  function clearKey() {
    setPrivateKey("nothing found in local storage"); // sets the private key hex string in the state
    localStorage.setItem("myPrivateKeyHex", ["nothing found in local storage"]); // saves the private key
    console.log("privateKey cleared");
  }

  useEffect(() =>
    {
      console.log("myScreed:",localStorage.getItem("myScreed"));
      setLoadedScreed(JSON.parse(localStorage.getItem("myScreed")) || ["nothing found in local storage"]);
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
    if (!sodium) {
      alert('ERROR: libsodium not found');
      return null;
    }
    if (!privateKey || privateKey === 'nothing found in local storage') {
      alert('You can\'t upload your screed without a private key!');
      return null;
    }
    const privKeyBytes = sodium.from_hex(privateKey); // Convert privateKey hex string to Uint8Array
    const pubKeyBytes = privKeyBytes.slice(32, 64); // Get public key (last 32 bytes)
    const publicKeyHex = sodium.to_hex(pubKeyBytes);
    const screedString = JSON.stringify(loadedScreed);
    const signature = sodium.to_base64(sodium.crypto_sign_detached(screedString, privKeyBytes));
    return { // Create the signed screed object
      screed: screedString,
      signature,
      publicKey: publicKeyHex
    };
  }

  function uploadScreed() {
    const signedObj = getSignedScreedObject();
    if (!signedObj) return;
    fetch("http://stemgrid.org:8993/upload-screed", {
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

  return (
    <div class="home">
      <h1>Secure Polling Demo</h1>
      <br />
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
          Your private key is: {privateKey} <br />Keep it secret, keep it safe!
          It is stored in your browser's local storage. It's used to sign your
          votes and opinions. It's never sent to the server.
          It's only useful with a signature of your public key by the registrar.
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
