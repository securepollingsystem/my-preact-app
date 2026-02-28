import preactLogo from '../../assets/preact.svg';
import './style.css';
import { useState, useEffect } from 'preact/hooks';
import { Modal } from "../../components/Modal.jsx";
import {
  genKey, registerPublicKey, getSignedScreedObject, getPublicKeyForDisplay, registrarPrivateKey,
  registrarPublicKey, hexToBytes, bytesToHex, bytesToBase64URL
} from 'sps-common';

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
  } catch (error) {
    console.log('could not try if !res.ok', error);
    if (searchText == '') {
      data = [{ id: 0, opinion: 'no data was returned from the server', screed_count: 53 }];
    }
  }

  console.log("fetched opinions:", data.length);

  return data;
};

export function Home() {
  const [showModal, setShowModal] = useState(false);
  const [searchString, setSearchString] = useState(""); // returns the value and a function to update the value (initially "")
  const [subset, setSubset] = useState([]);
  const [modalData, setModalData] = useState({ title: "title", children: "slkdfjslkdfjsldkfj" });
  const [loadedScreed, setLoadedScreed] = useState(['default val']);
  const [privateKey, setPrivateKey] = useState(['default val']);
  const [registrationToken, setRegistrationToken] = useState(null);
  const [activeTab, setActiveTab] = useState('search'); // 'screed' or 'search'

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
      }}>yes Clear My Screed</button>
      <button onClick={() => setShowModal(false)}>Cancel</button></div>);

    setModalData({
      title: "You are about to clear out your whole screed!",
      children: <div><br /><Buttons /></div>
    });
    setShowModal(true);
  }

  function deleteThisOpinionModal(opinion) {
    var Buttons = () => (<div>
      <button id="confirmBtn" onClick={() => {
        changeScreed(loadedScreed.filter(item => item !== opinion)); // remove this opinion
        setShowModal(false);
      }}>remove from my screed</button>
      <button onClick={() => setShowModal(false)}>Cancel</button></div>);

    setModalData({
      title: "Do you want to REMOVE this opinion from your screed?",
      children: <div><div>{opinion}</div><br /><Buttons /></div>
    });
    setShowModal(true);
  }

  function bringUpAddThisModal(opinion) {
    if (loadedScreed.indexOf(opinion) >= 0) {
      var Buttons = () => (<div>
        <button id="confirmBtn" onClick={() => setShowModal(false)}>Ok</button></div>);

      setModalData({
        title: "You already have this opinion in your screed",
        children: <div><div>{opinion}</div><br /><Buttons /></div>
      });
    } else {
      var Buttons = () => (<div>
        <button id="confirmBtn" onClick={() => addThisOpinion(opinion)}>Confirm</button>
        <button onClick={() => setShowModal(false)}>Cancel</button></div>);

      setModalData({
        title: "Do you want to add this opinion to your screed?",

        children: <div><div>{opinion}</div><br /><Buttons /></div>
      });
    }
    setShowModal(true);
  }

  function clearKey() {
    setPrivateKey("nothing found in local storage"); // sets the private key hex string in the state
    localStorage.setItem("myPrivateKeyHex", ["nothing found in local storage"]); // saves the private key
    setRegistrationToken(null); // clear registration token when clearing key
    console.log("privateKey cleared");
  }

  useEffect(() => {
    console.log("myPrivateKeyHex:", localStorage.getItem("myPrivateKeyHex"));
    setPrivateKey(localStorage.getItem("myPrivateKeyHex") || ["nothing found in local storage"]);
  },
    []
  );

  useEffect(() => {
    console.log("myScreed:", localStorage.getItem("myScreed"));
    setLoadedScreed(JSON.parse(localStorage.getItem("myScreed")) || []);
  },
    []
  );

  useEffect(() => {
    let cancelled = false;

    getSubset(searchString.toLowerCase()).then(data => {
      if (!cancelled) {
        const sorted = selectionSortArray(data, searchString);
        setSubset(sorted);
      }
    });

    // When searchString changes, React runs the cleanup function (setting cancelled = true) before firing
    // the effect again — so any in-flight promise from the previous call will simply discard its result.
    return () => {
      cancelled = true;
    };
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

  function uploadScreed() {
    const signedObj = getSignedScreedObject(loadedScreed, privateKey);
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

  // this function does NOT allow overlapping
  // for example ("foofoofoo", "foofoo") -> 1 | ("bararbarar", "arar") -> 2
  function substrOccurrences(str, substr) {
    str += "";
    substr += "";
    if (substr.length <= 0) return 0;

    var n = 0,
      pos = 0,
      step = substr.length;

    while (true) {
      pos = str.indexOf(substr, pos);
      if (pos >= 0) {
        n++;
        pos += step;
      } else break;
    }

    return n;
  }

  // ill optimize this later
  function selectionSortArray(arr, search) {
    const copy = [...arr];
    for (var i = 0; i < copy.length; i++) {
      var mindex = i;

      for (var j = i + 1; j < copy.length; j++) {
        if (substrOccurrences(copy[j].opinion, search) < substrOccurrences(copy[mindex].opinion, search)) {
          mindex = j;
        }
      }

      [copy[i], copy[mindex]] = [copy[mindex], copy[i]];
    }

    copy.reverse();

    return copy;
  }

  return (
    <div class="home">
      <h1>Secure Polling Demo</h1>
      <br />
      <div style={{
        display: "block",
        gap: "10px",
        marginBottom: "20px"
      }}>
        <button
          onClick={() => setActiveTab('search')}
          style={{
            padding: activeTab === 'search' ? "20px 20px" : "10px 20px",
            backgroundColor: activeTab === 'search' ? '#4CAF50' : '#ccc',
            color: activeTab === 'search' ? 'white' : 'black',
            cursor: 'pointer',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Search
        </button>
        <button
          onClick={() => setActiveTab('screed')}
          style={{
            padding: activeTab === 'screed' ? "20px 20px" : "10px 20px",
            backgroundColor: activeTab === 'screed' ? '#4CAF50' : '#ccc',
            color: activeTab === 'screed' ? 'white' : 'black',
            cursor: 'pointer',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          My Screed
        </button>
      </div>
      <div>
        {showModal &&
          <Modal onClose={() => setShowModal(false)} title={modalData.title}>
            {modalData.children}
          </Modal>
        }
      </div>
      {activeTab === 'screed' ? (
        <div>
          {/*My public key is {getPublicKeyForDisplay(privateKey)}*/}
          {privateKey == 'nothing found in local storage' ? (
            <div onClick={() => console.log("privateKey:", privateKey)} class="italic-info">
              You don't have an encryption key yet!
              <button onClick={() => genKey(setPrivateKey)} >Generate and save a new encryption key</button>
            </div>
          ) : (
            <div onClick={() => console.log("privateKey:", privateKey)} class="italic-info">
              {registrationToken && (
                <div style={{ marginTop: '10px', color: 'green' }}>
                  ✓ Your key is Registered, you can upload your screed
                </div>
              ) || (
                  <div style={{ marginTop: '10px', color: 'orange' }}>
                    ⚠️ You need to register your public key before uploading your screed.
                  </div>
                )}
            </div>
          )}
          <div style={{
            display: "flex"
          }}>
            <h1>My Screed:</h1>
            <button onClick={clearMyScreedModal}>Clear my screed!</button>
            <button onClick={uploadScreed}>Upload my screed</button>
            <button onClick={clearKey}>Clear my privateKey!</button>
            <button onClick={() => registerPublicKey(privateKey, setRegistrationToken)}>Register my public key</button>
          </div>
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
        </div>
      ) : (
        <div>
          <div style={{
            display: "flex"
          }}>
            <h1>Search text:</h1>
            <textarea
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