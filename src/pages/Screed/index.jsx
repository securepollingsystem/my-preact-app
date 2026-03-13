import { useState, useEffect } from 'preact/hooks';
import { genKey, registerPublicKey, getPublicKeyForDisplay } from 'sps-common';

export function Screed(props) {
  const { 
    loadedScreed, 
    privateKey, 
    registrationToken, 
    setPrivateKey, 
    setRegistrationToken,
    clearMyScreedModal, 
    deleteThisOpinionModal, 
    uploadScreed, 
    clearKey 
  } = props;

  return (
    <div>
      {/*My public key is {getPublicKeyForDisplay(privateKey)}*/}
      {privateKey == 'nothing found in local storage' ? (
        <div onClick={() => console.log("privateKey:",privateKey)} class="italic-info">
          You don't have an encryption key yet!
          <button onClick={() => genKey(setPrivateKey)} >Generate and save a new encryption key</button>
        </div>
      ) : (
        <div onClick={() => console.log("privateKey:",privateKey)} class="italic-info">
          {registrationToken && (
            <div style={{marginTop: '10px', color: 'green'}}>
              ✓ Your key is Registered, you can upload your screed
            </div>
          ) || (
            <div style={{marginTop: '10px', color: 'orange'}}>
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
  );
}
