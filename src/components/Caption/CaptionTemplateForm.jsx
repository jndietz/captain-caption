import { useEffect, useState } from "react";
import {
  Textarea,
  Button,
  Group,
  Box,
  TextInput,
  ActionIcon,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useForm, useFieldArray } from "react-hook-form";
import axios from "axios";
import { useFiles } from "../../hooks/useFiles";

import { IconDeviceFloppy } from "@tabler/icons-react";
import toast from "react-hot-toast";

export const getCamelCasedFieldName = (fieldName) => {
  const regex = /(<(\w*):?>?)/;
  const camelCasedFieldName = fieldName.match(regex)[2];
  return camelCasedFieldName;
};

export const getTitleCasedFieldName = (fieldName) => {
  const camelCasedFieldName = getCamelCasedFieldName(fieldName);
  const result = camelCasedFieldName.replace(/([A-Z])/g, " $1");
  const titleCasedFieldName = result.charAt(0).toUpperCase() + result.slice(1);
  return titleCasedFieldName;
};

export const CaptionTemplateForm = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { path, files, setFiles, selectedImageIndex } = useFiles();

  useEffect(() => {
    if (files && files.files)
      setValue("captionOutput", files.files[selectedImageIndex].caption);
  }, [selectedImageIndex]);

  const { control, getValues, register, setValue, formState, watch, reset } =
    useForm({
      defaultValues: {
        template: "",
        templateFields: [],
        captionOutput: ""
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "templateFields",
  });

  const watchFieldArray = watch("templateFields");
  const controlledFields = fields.map((field, index) => {
    return {
      ...field,
      ...watchFieldArray[index],
    };
  });

  const generateFields = () => {
    const fieldPlaceholders = getFieldPlaceHolders();
    remove();
    fieldPlaceholders.forEach((placeholder) =>
      append({
        label: getTitleCasedFieldName(placeholder),
        name: getCamelCasedFieldName(placeholder),
      })
    );
    setValue("captionOutput", getValues("template"));
  };

  const handleTemplateOnChange = () => {
    setValue("captionOutput", getValues("template"));
  };

  const getFieldPlaceHolders = () => {
    // TODO eventually support <fieldName:with|multiple|values>
    //     👇
    const regex = /(<\w*\:?(\w*\s*|\w*\s*\|)+>)/g;
    const templateString = getValues("template") || "";
    const templateFields = templateString.match(regex);
    return templateFields;
  };

  const generateCaption = () => {
    let captionOutput = getValues("template");
    const fieldPlaceHolders = getFieldPlaceHolders();
    fieldPlaceHolders.forEach((placeholder) => {
      captionOutput = captionOutput.replace(
        placeholder,
        getValues(`templateFields.${getCamelCasedFieldName(placeholder)}.value`)
      );
    });
    setValue("captionOutput", captionOutput);
  };

  const saveCaption = async () => {
    setIsSaving(true);
    const imageFilename = files.files[selectedImageIndex].filename;
    const captionFileName = imageFilename.replace(/\.[^/.]+$/, ".txt");
    const captionFullPath = `${path}\\${captionFileName}`;
    const caption = getValues("captionOutput");

    try {
      const { data } = await axios.post("/api/captions", {
        filename: captionFullPath,
        caption,
      });
      console.log(data);
      setIsSaving(false);
      const updatedFiles = files.files.map((file, index) => {
        if (index === selectedImageIndex) {
          file.caption = caption;
        }
        return file;
      });
      setFiles({ total: updatedFiles.length, files: updatedFiles });
      console.log(classes.backgroundColor);
      toast.success(`Saved caption for ${imageFilename}!`);
    } catch (e) {
      toast.error("Something bad happened...😲");
      console.error(e);
      setIsSaving(false);
    }
  };

  return (
    <Box mx="auto">
      <form>
        <Textarea
          placeholder="a <imageType> of a <animalType> eating a <foodType>"
          {...register("template", {
            onChange: () => handleTemplateOnChange(),
          })}
          label="Caption Template"
          autosize
        />

        <Group position="right" mt="md">
          <Button type="button" onClick={() => generateFields()}>
            Create Fields
          </Button>
        </Group>

        {controlledFields &&
          controlledFields.map((field) => {
            return (
              <TextInput
                key={field.id}
                required={true}
                label={field.label}
                {...register(`templateFields.${field.name}.value`)}
              />
            );
          })}

        <Textarea mt="lg" {...register("captionOutput")} minRows={10} />

        <Group position="right" mt="md">
          <Button type="button" onClick={() => generateCaption()}>
            Generate Caption
          </Button>
          <Button
            type="button"
            leftIcon={<IconDeviceFloppy />}
            loading={isSaving}
            disabled={!formState.isValid}
            onClick={() => saveCaption()}
          >
            Save Caption
          </Button>
          <ActionIcon onClick={() => reset()}>
            <IconTrash size="1rem" />
          </ActionIcon>
        </Group>
      </form>
    </Box>
  );
};
