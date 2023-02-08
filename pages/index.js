import Head from "next/head";
import { useEffect, useState, useRef } from "react";
//filters so that we don't detect unnecessary usb devices in a system
const filters = [
  { vendorId: 0x2fe3, productId: 0x0100 },
  { vendorId: 0x2fe3, productId: 0x00a },
  { vendorId: 0x8086, productId: 0xf8a1 },
];

export default function Home() {
  //Global components
  const [senderArea, setSenderArea] = useState("Type a message here: ");
  const [reciverArea, setReciverArea] = useState("");
  //const [endpointIn, setEndpointIn] = useState(0);
  //const [endpointOut, setEndpointOut] = useState(0);
  var endpointIn, endpointOut;

  let portRef = useRef();

  ///////////////////////////////////////////////////////////////////
  //
  //This function allows for establising connection with an usb device.
  //
  ///////////////////////////////////////////////////////////////////
  const Connect = async () => {
    try {
      let request = await navigator.usb.requestDevice({ filters: filters });
      portRef.current = request;
      console.log(portRef.current);
      //endpoints setup
      endpointIn =
        portRef.current.configuration.interfaces[0].alternate.endpoints[0]
          .endpointNumber;
      endpointOut =
        portRef.current.configuration.interfaces[0].alternate.endpoints[1]
          .endpointNumber;
      // portRef.current.configuration.interfaces[0].alternate.endpoints.filter(
      //   (endpoint) => endpoint.direction !== "in"
      // )[0];
      //setEndpointOut(endpoint);
      //console.log(endpointIn);
      //claiming an interface
      await portRef.current.open();
      if (portRef.current.configuration === null)
        await portRef.current.selectConfiguration(1);
      await portRef.current.claimInterface(0);
      //request.configuration.interfaces[2].interfaceNumber
      Listen(); //start listening for incoming transfers
    } catch (error) {
      portRef.current.close();
      console.log(error, "ERROR - connection failed");
    }
  };

  ///////////////////////////////////////////////////////////////////
  //
  //A function for listening for incoming WebUSB tranfers.
  //This is a recursive function as it has to always listen for
  //incoming transfers. It is in effect a text receiving function.
  //
  ///////////////////////////////////////////////////////////////////
  let Listen = () => {
    if (!portRef.current) return;
    portRef.current.transferIn(endpointIn, 64).then((result) => {
      setReciverArea(new TextDecoder().decode(result.data));

      Listen(); //recursion
    });
  };

  ///////////////////////////////////////////////////////////////////
  //
  //A function for reading a binary file. Takes the input of the
  //"choose file" button.
  //
  ///////////////////////////////////////////////////////////////////
  const ReadFile = async (input) => {
    let file = input.target.files[0];
    let reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = function () {
      console.log(reader.result);
      Send(reader);
    };
    reader.onerror = function () {
      console.log(reader.error);
    };
    console.log(input);
  };

  ///////////////////////////////////////////////////////////////////
  //
  //This function allows for sending data to the connected
  //usb device. Data has to be of string type.
  //
  ///////////////////////////////////////////////////////////////////
  const Send = (data) => {
    if (!portRef.current) return;
    if (data.length === 0) return;
    console.log("sending to serial:" + data.length);
    console.log("sending to serial: [" + data + "]\n");

    //converting the data into to utf-8 format
    let view = new TextEncoder().encode(data);
    console.log(view);
    portRef.current.transferOut(endpointOut, view);
  };

  //Rendered wabpage contents/ DOM structure
  return (
    <>
      <Head>
        <title>Delta WebUSB App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1>Delta WebUSB App demo</h1>
      <h2></h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <button
          id="connect"
          onClick={Connect}
          style={{ visibility: "visible", maxWidth: "max-content" }}
        >
          Connect To WebUSB Device
        </button>
        <div
          style={{
            marginTop: 100,
          }}
        >
          <input type="file" onChange={ReadFile}></input>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            marginTop: 150,
          }}
        ></div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 15,
          }}
        >
          <button id="submit" type="submit" onClick={() => Send(senderArea)}>
            Send
          </button>
          <label>
            Sender
            <textarea
              name="writeMessage"
              cols={30}
              onChange={(e) => setSenderArea(e.target.value)}
              value={senderArea}
            ></textarea>
          </label>
          <label htmlFor="output"> Receiver: </label>
          <textarea
            id="output"
            cols={30}
            readOnly
            value={reciverArea}
          ></textarea>
        </div>
      </div>
    </>
  );
}
