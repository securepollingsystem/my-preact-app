import preactLogo from '../../assets/preact.svg';
import './style.css';
import { useState, useEffect } from 'preact/hooks';
import { Modal } from "../../components/Modal.jsx";
import { genKey, registerPublicKey, getSignedScreedObject, getPublicKeyForDisplay } from 'sps-common';
import { tallyServer, uploadServer } from '../../urls.js';
import { Search } from '../Search/index.jsx';
import { Screed } from '../Screed/index.jsx';

export function Home() {
  const [showModal, setShowModal] = useState(false);
  const [searchString, setSearchString] = useState(""); // returns the value and a function to update the value (initially "")
  const [subset, setSubset] = useState([]);
  const [modalData, setModalData] = useState({title : "title", children : <div>slkdfjslkdfjsldkfj</div>});
  const [loadedScreed, setLoadedScreed] = useState(['default val']);
  const [privateKey, setPrivateKey] = useState('default val');
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
        <button id="confirmBtn" onClick={() => setShowModal(false)}>Ok</button></div>);

      setModalData({
        title : "You already have this opinion in your screed",
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

  function clearKey() {
    setPrivateKey("nothing found in local storage"); // sets the private key hex string in the state
    localStorage.setItem("myPrivateKeyHex", "nothing found in local storage"); // saves the private key
    setRegistrationToken(null); // clear registration token when clearing key
    console.log("privateKey cleared");
  }

  useEffect(() =>
    {
      console.log("myPrivateKeyHex:",localStorage.getItem("myPrivateKeyHex"));
      setPrivateKey(localStorage.getItem("myPrivateKeyHex") || "nothing found in local storage");
      console.log("myScreed:",localStorage.getItem("myScreed"));
      setLoadedScreed(JSON.parse(localStorage.getItem("myScreed")) || []);
    },
    []
  );

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
    fetch(uploadServer+'/upload-screed', {
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
      <br/>
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
        <Screed
          loadedScreed={loadedScreed}
          privateKey={privateKey}
          registrationToken={registrationToken}
          setPrivateKey={setPrivateKey}
          setRegistrationToken={setRegistrationToken}
          clearMyScreedModal={clearMyScreedModal}
          deleteThisOpinionModal={deleteThisOpinionModal}
          uploadScreed={uploadScreed}
          clearKey={clearKey}
        />
      ) : (
        <Search
          searchString={searchString}
          setSearchString={setSearchString}
          subset={subset}
          setSubset={setSubset}
          bringUpAddThisModal={bringUpAddThisModal}
        />
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
