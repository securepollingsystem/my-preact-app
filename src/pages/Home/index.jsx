import preactLogo from '../../assets/preact.svg';
import './style.css';
import { useState, useEffect } from 'preact/hooks';
import { Modal } from "../../components/Modal.jsx";

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

  var data = []

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
  const [showModal, setShowModal] = useState(false);
  const [searchString, setSearchString] = useState(""); // returns the value and a function to update the value (initially "")
  const [subset, setSubset] = useState([]);
  const [modalData, setModalData] = useState({title : "title", children : "slkdfjslkdfjsldkfj"});
  const [loadedScreed, setLoadedScreed] = useState(['default val']);

  function addThisOpinion(opinion) {
    setLoadedScreed([...loadedScreed, opinion]);
    localStorage.setItem("myScreed", JSON.stringify(loadedScreed));
    setShowModal(false);
    console.log(loadedScreed); // this works but loadedScreed goes back to its original definition from line 69
  }

  function clearMyScreedModal() {
    var Buttons = () => (<div>
      <button onClick={() => {
        setLoadedScreed([]);
        localStorage.setItem("myScreed", JSON.stringify(loadedScreed));
        setShowModal(false);
      } }>yes Clear My Screed</button>
      <button onClick={() => setShowModal(false)}>Cancel</button></div>);

    setModalData({title : "You are about to clear out your whole screed!",
    children : <div><Buttons /></div>});
    setShowModal(true);
  }

  function deleteThisOpinionModal(opinion) {
    var Buttons = () => (<div>
      <button onClick={() => {
        setLoadedScreed(loadedScreed.filter(item => item !== opinion)); // remove this opinion
        localStorage.setItem("myScreed", JSON.stringify(loadedScreed));
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
        <button onClick={() => setShowModal(false)}>Oops sorry</button></div>);

      setModalData({
        title : "You already have this opinion in your screed!",
        children : <div><div>{opinion}</div><Buttons /></div>
      });
    } else {
      var Buttons = () => (<div>
        <button onClick={() => addThisOpinion(opinion)}>Confirm</button>
        <button onClick={() => setShowModal(false)}>Cancel</button></div>);

      setModalData({title : "Do you want to add this opinion to your screed?",

      children : <div><div>{opinion}</div><Buttons /></div>});
    }

    // TODO: see if we already have it and behave accordingly
    // TODO: add a button to do what you're being asked to do
    // TODO: hook escape key to close modal
    setShowModal(true);
  }

  useEffect(() =>
    setLoadedScreed(
      JSON.parse(
        localStorage.getItem("myScreed")
      ) || ["nothing found in local storage"]
    ),
    []
  );

  useEffect(() => {
    getSubset(searchString.toLowerCase()).then(setSubset);
  }, [searchString]); // searchString is what it watches and reloads the fetch on changes!!!!!!!

  // returning JSX
  //console.log('what is subset', subset); // looks like json
  return (
    <div class="home">
      <h4>Secure Polling Demo</h4>
      <br />
      <div style={{
        display: "flex"
          }}>
        <h1>Your Screed:</h1>
        <button onClick={() => clearMyScreedModal()}>Clear my screed!</button>
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
        onChange={(e) => setSearchString(e.target.value)}
      />
    </div>
      {subset.length === 0 ? (
        <div
          onClick={() => bringUpAddThisModal(searchString)}
          key="compose"
          class="opinion"
        >
          click this to add {searchString} to your screed
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
