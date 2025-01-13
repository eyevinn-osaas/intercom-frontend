import styled from "@emotion/styled";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isMobile } from "../../bowser";
import { TBasicProductionResponse } from "../../api/api";
import { useGlobalState } from "../../global-state/context-provider";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
  UsersIcon,
} from "../../assets/icons/icon";
import { SecondaryButton } from "../landing-page/form-elements";
import { ProgramOutputModal } from "../program-output-modal/program-output-modal";

const ProductionItemWrapper = styled.div`
  text-align: start;
  color: #ffffff;
  background-color: transparent;
  flex: 0 0 calc(25% - 2rem);
  ${() => (isMobile ? `flex-grow: 1;` : `flex-grow: 0;`)}
  justify-content: start;
  min-width: 20rem;
  border: 1px solid #424242;
  border-radius: 0.5rem;
  margin: 0 2rem 2rem 0;
  cursor: pointer;
`;

const ProductionName = styled.div`
  font-size: 1.4rem;
  font-weight: bold;
  margin-right: 1rem;
  word-break: break-word;
`;

const ParticipantCount = styled.div`
  font-size: 1.5rem;
  color: #9e9e9e;
`;

const HeaderWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 2rem;
`;

const HeaderTexts = styled.div`
  display: flex;
  align-items: center;
  svg {
    height: 1.5rem;
    width: 1.5rem;
    margin-right: 0.5rem;
  }
  &.active {
    svg {
      fill: #73d16d;
    }
  }
`;

const HeaderIcon = styled.svg`
  height: 2rem;
  width: 2rem;
  fill: #d6d3d1;
`;

const ProductionLines = styled.div`
  display: grid;
  padding: 0 2rem;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease-out;

  &.expanded {
    grid-template-rows: 1fr;
    padding-bottom: 2rem;
  }
`;

const InnerDiv = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Lineblock = styled.div`
  margin-top: 1rem;
  background-color: #4d4d4d;
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LineBlockTexts = styled.div``;

const LineBlockTitle = styled.div`
  font-weight: bold;
  font-size: 1.5rem;
`;

const LineBlockParticipants = styled.div``;

const LineBlockParticipant = styled.div`
  margin-top: 0.5rem;
  display: flex;
  align-items: center;

  svg {
    height: 2rem;
    width: 2rem;
  }
`;

const PersonText = styled.div`
  margin-left: 0.5rem;
`;

type ProductionsListItemProps = {
  production: TBasicProductionResponse;
};

export const ProductionsListItem = ({
  production,
}: ProductionsListItemProps) => {
  const [{ userSettings }, dispatch] = useGlobalState();
  const [open, setOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalLineId, setModalLineId] = useState<string | null>(null);
  const [isProgramUser, setIsProgramUser] = useState<boolean>(false);
  const navigate = useNavigate();

  const totalParticipants = useMemo(() => {
    return (
      production.lines
        ?.map((line) => line.participants.length || 0)
        .reduce((partialSum, a) => partialSum + a, 0) || 0
    );
  }, [production]);

  const getLineByLineId = (lineId: string) => {
    return production.lines?.find((l) => l.id === lineId);
  };

  const goToProduction = (lineId: string) => {
    if (userSettings?.username) {
      const payload = {
        productionId: production.productionId,
        lineId,
        username: userSettings.username,
        audioinput: userSettings?.audioinput,
        audiooutput: userSettings?.audiooutput,
        lineUsedForProgramOutput:
          getLineByLineId(lineId)?.programOutputLine || false,
        isProgramUser,
      };

      const uuid = globalThis.crypto.randomUUID();

      dispatch({
        type: "ADD_CALL",
        payload: {
          id: uuid,
          callState: {
            joinProductionOptions: payload,
            mediaStreamInput: null,
            dominantSpeaker: null,
            audioLevelAboveThreshold: false,
            connectionState: null,
            audioElements: null,
            sessionId: null,
            dataChannel: null,
            isRemotelyMuted: false,
            hotkeys: {
              muteHotkey: "m",
              speakerHotkey: "n",
              pushToTalkHotkey: "t",
              increaseVolumeHotkey: "u",
              decreaseVolumeHotkey: "d",
              globalMuteHotkey: "p",
            },
          },
        },
      });
      dispatch({
        type: "SELECT_PRODUCTION_ID",
        payload: payload.productionId,
      });
      navigate(
        `/production-calls/production/${payload.productionId}/line/${lineId}`
      );
    }
  };

  return (
    <ProductionItemWrapper>
      <HeaderWrapper onClick={() => setOpen(!open)}>
        <HeaderTexts className={totalParticipants > 0 ? "active" : ""}>
          <ProductionName>{production.name}</ProductionName>
          <UsersIcon />
          <ParticipantCount>{totalParticipants}</ParticipantCount>
        </HeaderTexts>
        <HeaderIcon>
          {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </HeaderIcon>
      </HeaderWrapper>
      <ProductionLines className={open ? "expanded" : ""}>
        <InnerDiv>
          {production.lines?.map((l) => (
            <Lineblock key={`line-${l.smbConferenceId}`}>
              <LineBlockTexts>
                <LineBlockTitle>{l.name}</LineBlockTitle>
                <LineBlockParticipants>
                  {l.participants.map((participant) => (
                    <LineBlockParticipant
                      key={`participant-${participant.sessionId}`}
                    >
                      <UserIcon />
                      <PersonText>{participant.name}</PersonText>
                    </LineBlockParticipant>
                  ))}
                </LineBlockParticipants>
              </LineBlockTexts>
              <SecondaryButton
                type="button"
                onClick={() => {
                  if (l.programOutputLine) {
                    setModalLineId(l.id);
                    setIsModalOpen(true);
                  } else {
                    goToProduction(l.id);
                  }
                }}
              >
                Join
              </SecondaryButton>
              {isModalOpen && modalLineId && (
                <ProgramOutputModal
                  onClose={() => setIsModalOpen(false)}
                  onJoin={() => {
                    setIsModalOpen(false);
                    goToProduction(modalLineId);
                  }}
                  setIsProgramUser={setIsProgramUser}
                />
              )}
            </Lineblock>
          ))}
        </InnerDiv>
      </ProductionLines>
    </ProductionItemWrapper>
  );
};
