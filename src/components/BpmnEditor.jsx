import { useEffect, useRef } from "react";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "@bpmn-io/properties-panel/assets/properties-panel.css";

import BpmnModeler from "bpmn-js/lib/Modeler";
import camundaModdlePackage from "camunda-bpmn-moddle/resources/camunda";
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  CamundaPlatformPropertiesProviderModule,
} from "bpmn-js-properties-panel";
import { diagramXML } from "../resources/newDiagram.bpmn.jsx";

const BpmnEditor = () => {
  const container = useRef();
  const canvas = useRef();
  const panel = useRef();
  const modeler = useRef(null);

  useEffect(() => {
    if (!modeler.current) {
      modeler.current = new BpmnModeler({
        container: canvas.current,
        keyboard: {
          bindTo: window,
        },
        propertiesPanel: {
          parent: panel.current,
        },
        additionalModules: [
          BpmnPropertiesPanelModule,
          BpmnPropertiesProviderModule,
          CamundaPlatformPropertiesProviderModule,
        ],
        moddleExtensions: {
          camunda: camundaModdlePackage,
        },
      });

      async function openDiagram(xml) {
        try {
          await modeler.current.importXML(xml);
        } catch (err) {
          console.error(err);
        }
      }
      openDiagram(diagramXML);

      // check file api availability
      if (!window.FileList || !window.FileReader) {
        window.alert(
          "Looks like you use an older browser that does not support drag and drop. " +
            "Try using Chrome, Firefox or the Internet Explorer > 10."
        );
      } else {
        registerFileDrop(container, openDiagram);
      }

      function registerFileDrop(container, callback) {
        function handleFileSelect(e) {
          e.stopPropagation();
          e.preventDefault();

          var files = e.dataTransfer.files;

          var file = files[0];

          var reader = new FileReader();

          reader.onload = function (e) {
            var xml = e.target.result;

            callback(xml);
          };

          reader.readAsText(file);
        }

        function handleDragOver(e) {
          e.stopPropagation();
          e.preventDefault();

          e.dataTransfer.dropEffect = "copy"; // Explicitly show this is a copy.
        }

        container.current.addEventListener("dragover", handleDragOver, false);
        container.current.addEventListener("drop", handleFileSelect, false);
      }

      var exportArtifacts = debounce(async function () {
        try {
          const { svg } = await modeler.current.saveSVG();
          console.log("svg", svg);
        } catch (err) {
          console.error("Error happened saving svg: ", err);
        }

        try {
          const { xml } = await modeler.current.saveXML({ format: true });
          console.log("xml", JSON.stringify(xml));
        } catch (err) {
          console.error("Error happened saving XML: ", err);
        }
      }, 500);

      modeler.current.on("commandStack.changed", exportArtifacts);
    }
  }, []);

  // helpers //////////////////////

  function debounce(fn, timeout) {
    var timer;

    return function () {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(fn, timeout);
    };
  }
  return (
    <>
      <div className="content" ref={container}>
        <div className="canvas" id="js-canvas" ref={canvas}></div>
        <div
          className="properties-panel-parent"
          id="js-properties-panel"
          ref={panel}
        ></div>
        <ul className="buttons">
          <li>download</li>
        </ul>
      </div>
    </>
  );
};

export default BpmnEditor;
