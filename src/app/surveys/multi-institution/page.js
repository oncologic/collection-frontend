"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useSurveyContext } from "../../context/SurveyContext";
import SelectField from "@/app/components/inputs/SelectField";
import InputField from "@/app/components/inputs/InputField";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Mock API call function - replace with your actual API call
const fetchSurveyDetails = async () => {
  // Replace with your API endpoint
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return [
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "b73fee4a-156d-4973-8a09-05ad1fbc5022",
      question: "Sex",
      question_type: "select",
      question_options: ["Male", "Female", "Other"],
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "b76cea57-6a23-4a09-943c-427502ec602e",
      question: "Age at Initial Diagnosis (years)",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "f8992287-7504-4f95-90de-12ea1c3e7284",
      question: "Race",
      question_type: "select",
      question_options: [
        "White",
        "Black",
        "Asian",
        "Native American",
        "Pacific Islander",
        "Other",
        "N/A",
      ],
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "b5538a92-ed0b-4676-9ba1-9536071fccc1",
      question: "Ethnicity",
      question_type: "select",
      question_options: ["Hispanic or Latino", "Not Hispanic or Latino", "N/A"],
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "dc05cf51-6a13-46ba-950f-b1103ae799f8",
      question: "Nephrectomy",
      question_type: "boolean",
      question_options: { 0: "No", 1: "Yes" },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "8066a94f-f5e4-4fdd-9530-8d322345a225",
      question: "Time from initial diagnosis to nephrectomy, days",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "891bb148-ad4a-493e-ac72-331db77da587",
      question: "Overall survival event",
      question_type: "select",
      question_options: { 0: "Alive", 1: "Dead" },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "ab9b7b3f-47ce-4741-a06b-08cacd09eaab",
      question: "Time from initial diagnosis to death or last follow-up, days",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "f3fb06da-fd92-4cd9-982e-f1b0ea128a45",
      question: "Neoadjuvant/adjuvant therapy?",
      question_type: "boolean",
      question_options: { 0: "No", 1: "Yes" },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "190e1203-7df6-4d05-a60e-1ebc59d93249",
      question: "Secondary histology",
      question_type: "text",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "7b78772e-fbfd-480f-b2bf-0029271e1a3f",
      question: "Sarcomatoid?",
      question_type: "boolean",
      question_options: { 0: "No", 1: "Yes" },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "8b6ba24d-56b4-4a21-a39a-81e64360966b",
      question: "% Sarcomatoid",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "922b6b42-bb1f-481f-b385-f1f622051cf6",
      question: "Tumor necrosis",
      question_type: "select",
      question_options: {
        0: "Not Present",
        1: "Present",
        "N/A": "Not specified",
      },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "4eab497b-f62a-4555-9a93-5feecec909e4",
      question: "Pathologic T stage",
      question_type: "select",
      question_options: ["pT1", "pT2", "pT3", "pT4"],
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "6cdbfb07-7593-46bc-b480-2dc0d0b0465f",
      question: "Pathologic N stage",
      question_type: "select",
      question_options: ["pN0", "pN1", "pNx"],
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "191eddbb-cbb0-454a-8f83-05cf10361f19",
      question: "Largest tumor size (cm)",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "2494e671-5ba3-4fce-bdaa-f22befdc19c3",
      question: "Denovo (synchronous) metastatic disease",
      question_type: "boolean",
      question_options: { 0: "No", 1: "Yes" },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "020ccca1-4369-4772-b06e-76efd0aec4ba",
      question: "Molecular/NGS info?",
      question_type: "boolean",
      question_options: { 0: "No", 1: "Yes" },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "d7f0b2a4-5743-4dd5-b298-e6381f8e036a",
      question: "Gene alteration (if NGS was done)",
      question_type: "text",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "2c81e20e-c8ee-460e-a2ae-ad7f9fdd1136",
      question: "Time from initial diagnosis to metastatic diagnosis, days",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "07a6d71d-3b36-44cf-83e3-1471904fa35b",
      question: "Lung mets?",
      question_type: "boolean",
      question_options: { 0: "No", 1: "Yes" },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "e85849dc-dc1d-44ba-b06a-6b7dc018139e",
      question: "Lymph Node mets?",
      question_type: "boolean",
      question_options: { 0: "No", 1: "Yes" },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "39fc5e9c-6a4a-46f2-9103-7e7b3ee1c553",
      question: "Liver mets?",
      question_type: "boolean",
      question_options: { 0: "No", 1: "Yes" },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "40a1758a-3a7c-4cda-887f-0ffd91ac6270",
      question: "Bone mets?",
      question_type: "boolean",
      question_options: { 0: "No", 1: "Yes" },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "2d638cda-8f03-451a-bbdb-3cd77c8fa3b7",
      question: "Brain mets?",
      question_type: "boolean",
      question_options: { 0: "No", 1: "Yes" },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "fa36f855-e539-4b29-b9bd-df864321f830",
      question: "Adrenal mets?",
      question_type: "boolean",
      question_options: { 0: "No", 1: "Yes" },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "e9ab74dc-4fb5-4d71-8eb9-8b2ca6157899",
      question: "Soft tissue mets?",
      question_type: "boolean",
      question_options: { 0: "No", 1: "Yes" },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "1da5d1ea-e549-4e7d-aa5d-ac93372712dd",
      question: "Other mets?",
      question_type: "boolean",
      question_options: { 0: "No", 1: "Yes" },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "64dffcaa-4804-4bc1-b9f1-97e20c65a83c",
      question: "Description of other mets",
      question_type: "text",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "f742871a-f868-4c42-9baf-98268fa123aa",
      question: "KPS",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "0ea3268a-7cb9-41f0-8659-ae017c231f68",
      question: "ECOG",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "951458ef-9169-433e-87e5-cb32ade5ef65",
      question: "<1 year from dx to systemic therapy",
      question_type: "boolean",
      question_options: { 0: "No", 1: "Yes" },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "edf6b89f-a48a-48ac-a925-928c8b92adb9",
      question: "Hgb",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "1b043bb8-bdc7-44fb-83b9-612391228a35",
      question: "Calcium",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "ba7c4186-4c41-49e5-95e7-825f528274b1",
      question: "Platelets",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "be723ff1-ec14-4e5f-93c6-58c4b466a6c3",
      question: "Neutrophils",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "c6953e0f-30f2-4c2a-af77-479f0b41c32d",
      question: "IMDC risk",
      question_type: "select",
      question_options: {
        1: "Favorable",
        2: "Intermediate",
        3: "Poor",
        NA: "Unknown",
      },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "b407c598-6b4a-45a4-a906-74ee85e62937",
      question: "Agent",
      question_type: "text",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "6e2b912d-1fdf-497a-9011-48253626d3ee",
      question:
        "Date from initial diagnosis to first line systemic therapy start, days",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "5ecdf31d-aec5-486b-b6a1-4bc8405d6611",
      question:
        "Date from initial diagnosis to first line systemic therapy stop, days",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "8400818f-ddce-46dd-a6b8-b48b28180596",
      question: "Continue vs DC",
      question_type: "select",
      question_options: { 0: "DC", 1: "Continue" },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "7aa9ff14-b493-45f3-9f46-a9ea02ab4d65",
      question: "Reason for stopping",
      question_type: "select",
      question_options: { 1: "POD", 2: "toxicity", 3: "death", 4: "Other" },
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "eb555803-1d71-439f-bf3e-b97dea6f038e",
      question: "RECIST: Category of best response",
      question_type: "text",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "def0c5b7-2615-43ec-9544-a43543aaca8a",
      question:
        "RECIST: Data from initial diagnosis to best response on first line, days",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "9624494d-3309-4e75-aa7c-82f17a46b35d",
      question: "RECIST: Greatest % change in target lesions",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "54a8322b-5bf2-4789-81c0-91f80161a935",
      question:
        "RECIST: Data from initial diagnosis to progression on first line, days",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "674c19ea-027c-4767-bc18-1c8fb9acfd4f",
      question:
        "TTF for 1L (Date from 1st line start to 1st line end or last FU)",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "688436e1-e147-40c1-bcf4-40439fd0df7c",
      question:
        "OS From 1L line: (Date from 1st line tx to death or last FU), days",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "b9713885-d017-4abc-bd7f-b7f9ed2101b0",
      question:
        "OS from initial dx: Date from first RCC diagnosis to death or last FU, days",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "79be7625-c338-4fde-a09a-83dbe9b6645f",
      question: "Age at time of first metastatic disease diagnosis, years",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "3fc9b5a0-022c-4f69-b04d-0b1d9670f4f6",
      question: "Time from nephrectomy to mRCC dx",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
    {
      survey_id: "31989224-9dae-4ecd-be36-671782e335c2",
      survey_name: "Multi-Institution",
      survey_description: "Survey transformation to match schema",
      question_id: "1ecd998f-540d-4d1f-aa34-7971849b0a46",
      question: "Systemic Treatment Free survival",
      question_type: "number",
      question_options: null,
      question_created_at: "2024-12-25 04:49:20.053380",
    },
  ]; // Your survey questions array
};

export default function DynamicSurveyForm() {
  const { register, handleSubmit, control } = useForm();
  const [surveyData, setSurveyData] = useState(null);
  const { setState } = useSurveyContext();
  const [isLoading, setIsLoading] = useState(true);

  // Watch all form values
  const formValues = useWatch({ control });

  // Helper function to check if a question is answered
  const isQuestionAnswered = (questionId, value) => {
    if (!value) return false;

    if (typeof value === "object" && "id" in value) {
      return value.id !== null;
    }

    return true;
  };

  useEffect(() => {
    const loadSurveyData = async () => {
      const data = await fetchSurveyDetails();
      setSurveyData(data);
      setIsLoading(false);
    };
    loadSurveyData();
  }, []);

  const onSubmit = (data) => {
    // Clean up the data by removing null values or converting them to appropriate format
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      // If the value is an object (from SelectField) and has an id property
      if (value && typeof value === "object" && "id" in value) {
        acc[key] = value.id; // Only store the id
      } else {
        acc[key] = value; // Keep other values as is
      }
      return acc;
    }, {});

    setState((prevState) => ({
      ...prevState,
      step: prevState.step + 1,
      surveyResponses: cleanedData,
    }));
  };

  const renderQuestion = (question) => {
    const isAnswered =
      formValues &&
      isQuestionAnswered(
        question.question_id,
        formValues[question.question_id]
      );

    const QuestionWrapper = ({ children }) => (
      <div
        className={`w-full h-full flex flex-row justify-start items-center gap-2 pl-8 pr-8 pt-2 pb-2 ${
          isAnswered ? "bg-green-50" : ""
        }`}
      >
        {isAnswered && (
          <FontAwesomeIcon
            icon={faCheckCircle}
            className="text-green-400 border-2 border-green-500 rounded-full p-1 text-6xl h-3 w-3"
          />
        )}
        {children}
      </div>
    );

    switch (question.question_type) {
      case "select":
        const options = Array.isArray(question.question_options)
          ? question.question_options.map((opt) => ({ id: opt, name: opt }))
          : Object.entries(question.question_options).map(([id, name]) => ({
              id,
              name,
            }));

        options.unshift({ id: null, name: "Not Specified" });

        return (
          <QuestionWrapper>
            <div className="w-full mx-auto mb-6">
              <SelectField
                label={question.question}
                options={options}
                centerSelected={true}
                control={control}
                name={question.question_id}
                defaultValue={null}
              />
            </div>
          </QuestionWrapper>
        );

      case "number":
        return (
          <QuestionWrapper>
            <InputField
              id={question.question_id}
              name={question.question_id}
              label={question.question}
              type="number"
              placeholder={`Enter ${question.question.toLowerCase()}`}
              register={register}
            />
          </QuestionWrapper>
        );

      case "boolean":
        return (
          <QuestionWrapper>
            <div className="w-full mx-auto mb-6">
              <SelectField
                label={question.question}
                options={[
                  { id: null, name: "Not Specified" },
                  { id: "1", name: "Yes" },
                  { id: "0", name: "No" },
                ]}
                centerSelected={true}
                control={control}
                name={question.question_id}
                defaultValue={null}
              />
            </div>
          </QuestionWrapper>
        );

      case "text":
      default:
        return (
          <QuestionWrapper>
            <InputField
              id={question.question_id}
              name={question.question_id}
              label={question.question}
              placeholder={`Enter ${question.question.toLowerCase()}`}
              register={register}
            />
          </QuestionWrapper>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-1/2 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 md:w-5/6 w-full h-96">
          <div className="w-3/4 h-8 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="w-full h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="w-5/6 h-4 bg-gray-200 rounded mb-4 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!surveyData) return null;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 mx-auto mt-4">
      <div className="flex flex-row justify-start items-center gap-2 w-full">
        <h1 className="text-white bg-red-400 pt-2 pb-2 px-4 md:w-1/5 rounded-lg  text-center md:text-center font-bold">
          Admin Entry Form
        </h1>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="text-gray-700 text-center md:text-left w-full mx-auto"
      >
        <h1 className="md:text-4xl text-2xl font-bold text-center text-gray-700">
          {surveyData[0]?.survey_name || "Survey"}
        </h1>
        <p className="text-gray-400 text-center w-full mb-8">
          {surveyData[0]?.survey_description}
        </p>

        <div className="flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-3 rounded-lg ml-12 mr-12">
            {surveyData.map((question) => (
              <div key={question.question_id} className="w-full">
                {renderQuestion(question)}
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-12">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white text-xl font-bold py-2 px-8 rounded"
            >
              Submit
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
