'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { 
  Button, 
  FormControl, 
  FormErrorMessage, 
  FormLabel, 
  Icon, 
  Input,
  InputGroup,
  TableContainer,
  Table,
  TableCaption,
  Text,
  Thead,
  Tr,
  Th,
  Td,
  Tbody,
  Tfoot
} from '@chakra-ui/react'
import Image from 'next/image'
import { useForm, UseFormRegisterReturn } from 'react-hook-form'
import { FiFile } from 'react-icons/fi'
import styles from './page.module.css'

type FileUploadProps = {
  register: UseFormRegisterReturn
  accept?: string
  multiple?: boolean
  children?: ReactNode
}

type DisplayDataResponse = {
  data: Photo[]
}

type Photo = {
  imageUrl: string
  comment: string
}

const FileUpload = (props: FileUploadProps) => {
  const { register, accept, multiple, children } = props
  const [fileName, setFileName] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { ref, ...rest } = register as {ref: (instance: HTMLInputElement | null) => void}

  const handleClick = () => inputRef.current?.click()

  return (
      <InputGroup onClick={handleClick}>
        <input
          type={'file'}
          multiple={multiple || false}
          hidden
          accept={accept}
          {...rest}
          ref={(e) => {
            ref(e)
            inputRef.current = e
          }}
          onChange={(e) => {
            const value = e.target.value;
            const name = value.replace(/^.*[\\\/]/, '');
            setFileName(name);
          }}
        />
        <>
          <Button leftIcon={<Icon as={FiFile} />} className={styles.uploadbutton}>
            Upload
          </Button>
          <Text fontSize='sm' className={styles.uploadedimage} >
            {fileName}
          </Text>
        </>
      </InputGroup>
  )
}

type FormValues = {
  file_: FileList
}

const Home = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>()
  const [comment, setComment] = useState<string>('');
  const [photos, setPhotos] = useState<Photo[]>([]);

  const onSubmit = handleSubmit((data) => {
    console.log('On Submit: ', data);
    
    const formData = new FormData();
    formData.append("file", data?.file_[0]);
    formData.append("comment", comment);

    fetch("http://localhost:8080/photo/upload", {
        method: "POST",
        body: formData
    })
    .then(results => results.json())
    .then(data => {
        console.log("Data ", data);
        displayPhotos();
    })
  })

  const validateFiles = (value: FileList) => {
    if (value.length < 1) {
      return 'Files is required'
    }
    for (const file of Array.from(value)) {
      const fsMb = file.size / (1024 * 1024)
      const MAX_FILE_SIZE = 10
      if (fsMb > MAX_FILE_SIZE) {
        return 'Max file size 10mb'
      }
    }
    return true
  }

  const displayPhotos = () => {
    fetch("http://localhost:8080/photo/displayData", { next: { revalidate: 10 } })
    .then(results => results.json())
    .then((data :DisplayDataResponse) => {
        console.log("Results ", data);
        setPhotos(data.data);
    })
  }

  useEffect(() => {
    displayPhotos();
  }, []);

  console.log("Photos ", photos);

  return (
    <>
      <form onSubmit={onSubmit} className={styles.formupload} >
        <FormControl isInvalid={!!errors.file_} isRequired>
          <Text fontSize='xl' className={styles.uploadheader}>Upload Photo</Text>
          <div>
            <FormLabel style={{ width: '200px', fontSize: 14}}>Click here</FormLabel>
            <FileUpload
              accept={'image/*'}
              multiple
              register={register('file_', { validate: validateFiles })}
            />
          </div>
          <FormErrorMessage>
            {errors.file_ && errors?.file_.message}
          </FormErrorMessage>
          <Input 
            value={comment} 
            placeholder='Comment' 
            size='md' 
            type='text' 
            className={styles.comment}
            onChange={(e) => setComment(e.target.value)} 
          />
        </FormControl>
        <button className={styles.submitbutton}>Submit</button>
      </form>

      <TableContainer>
        <Table variant='simple' className={styles.phototable}>
          <Thead className={styles.tablehead}>
            <Tr>
              <Th>Image</Th>
              <Th>Comment</Th>
            </Tr>
          </Thead>
          <Tbody>
            {photos.length > 0 && photos.map((item) => {
              return (
                <Tr key={"photos-" + item.imageUrl} >
                  <Td>
                    <Image
                      alt={item.comment}
                      src={item.imageUrl}
                      placeholder="blur"
                      width={400}
                      height={400}
                      style={{
                        objectFit: 'cover',
                      }}
                      loading='lazy'
                      blurDataURL="data:image/jpeg"
                    />
                  </Td>
                  <Td>{item.comment}</Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  )
}

export default Home