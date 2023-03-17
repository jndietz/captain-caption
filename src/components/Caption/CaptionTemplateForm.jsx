import { useRef, useEffect } from 'react';
import { Textarea, Button, Group, Box, TextInput, ActionIcon } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useForm, useFieldArray } from 'react-hook-form';
import axios from 'axios';
import { useFiles } from '../../hooks/useFiles';

export const getCamelCasedFieldName = (fieldName) => {
    const regex = /(<(\w*):?>?)/;
    const camelCasedFieldName = fieldName.match(regex)[2]
    return camelCasedFieldName;
}

export const getTitleCasedFieldName = (fieldName) => {
    const camelCasedFieldName = getCamelCasedFieldName(fieldName);
    const result = camelCasedFieldName.replace(/([A-Z])/g, " $1");
    const titleCasedFieldName = result.charAt(0).toUpperCase() + result.slice(1);
    return titleCasedFieldName;
}

export const CaptionTemplateForm = () => {

    const { files, selectedImageIndex } = useFiles();

    useEffect(() => {
        if (files) setValue("captionOutput", files.files[selectedImageIndex].caption);
    }, [selectedImageIndex])

    const { control, getValues, register, setValue, formState, watch, reset } = useForm({
        defaultValues: {
            template: 'A <drawingType> of a <gender> sitting on a <chairType>',
            templateFields: []
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "templateFields"
    });

    const watchFieldArray = watch("templateFields");
    const controlledFields = fields.map((field, index) => {
        return {
            ...field,
            ...watchFieldArray[index]
        };
    });

    const generateFields = () => {
        const fieldPlaceholders = getFieldPlaceHolders();
        remove();
        fieldPlaceholders.forEach(placeholder => append({ label: getTitleCasedFieldName(placeholder), name: getCamelCasedFieldName(placeholder) }));
        setValue("captionOutput", getValues("template"));
    }

    const handleTemplateOnChange = () => {
        setValue("captionOutput", getValues("template"));
    }

    const getFieldPlaceHolders = () => {
        // TODO eventually support <fieldName:with|multiple|values>
        //     👇
        const regex = /(<\w*\:?(\w*\s*|\w*\s*\|)+>)/g;
        const templateString = getValues("template") || "";
        const templateFields = templateString.match(regex);
        return templateFields;
    }

    const generateCaption = () => {
        let captionOutput = getValues("template");
        const fieldPlaceHolders = getFieldPlaceHolders();
        fieldPlaceHolders.forEach(placeholder => {
            captionOutput = captionOutput.replace(placeholder, getValues(`templateFields.${getCamelCasedFieldName(placeholder)}.value`));
        });
        setValue("captionOutput", captionOutput);
    }

    const saveCaption = async () => {
        const { data } = await axios.post("/api/images", { filename: files.files[selectedImageIndex].filename, caption: getValues("captionOutput") });
        
        console.log(data);
    }

    return (
        <Box mx="auto">
            <form>
                <Textarea
                    {...register("template", { onChange: () => handleTemplateOnChange() })}
                    label="Caption Template"
                    autosize    
                />

                <Group position="right" mt="md">
                    <Button type="button" onClick={() => generateFields()}>Create Fields</Button>
                </Group>

                {controlledFields && controlledFields.map((field) => {
                    return (<TextInput
                        key={field.id}
                        required={true}
                        label={field.label}
                        {...register(`templateFields.${field.name}.value`)} />)
                }
                )}

                <Textarea
                    mt="lg"
                    {...register('captionOutput')}
                    minRows={10}
                />

                <Group position="right" mt="md">
                    <Button type="button" onClick={() => generateCaption()}>Generate Caption</Button>
                    <Button type="button" disabled={!formState.isValid} onClick={() => saveCaption()}>Save Caption</Button>
                    <ActionIcon onClick={() => reset()}><IconTrash size="1rem" /></ActionIcon>
                </Group>
            </form>
        </Box>
    );
}